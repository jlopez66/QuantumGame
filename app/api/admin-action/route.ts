import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getNextStep, getStep, type GameNumber, type RoundNumber } from "@/lib/game/rounds";
import { scoreGame1, scoreGame2, scoreGame3 } from "@/lib/game/scoring";
import type { ActiveRepresentatives, Database, RevealPayload } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Action = "start" | "lock" | "reveal" | "next" | "reset";

interface Body {
  action: Action;
}

// Tiempo de debate en mesa después de que la ruleta elige representante,
// antes de que arranque el timer de respuesta (o el intro del Juego 3).
const ROULETTE_DEBATE_SECONDS = 60;

/**
 * Elige al azar 1 representante por equipo entre los jugadores YA reclamados
 * (device_id no nulo) de ese equipo. Un equipo sin nadie conectado
 * simplemente no aparece en el resultado — esa mesa no podrá responder esta
 * ronda (0 pts, igual que si nadie hubiera contestado).
 */
async function pickRepresentatives(db: SupabaseClient<Database>): Promise<ActiveRepresentatives> {
  const { data: teams } = await db.from("teams").select("id");
  const { data: players } = await db
    .from("players")
    .select("id, team_id, name, avatar_url")
    .not("device_id", "is", null);

  const reps: ActiveRepresentatives = {};
  for (const team of teams ?? []) {
    const pool = (players ?? []).filter((p) => p.team_id === team.id);
    if (pool.length === 0) continue;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    reps[team.id] = { player_id: chosen.id, name: chosen.name, avatar_url: chosen.avatar_url };
  }
  return reps;
}

export async function POST(req: Request) {
  const { action } = (await req.json()) as Body;
  const db = createAdminClient();

  switch (action) {
    case "start":
    case "next": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const current =
        action === "start" ? null : { game: state?.current_game ?? null, round: state?.current_round ?? null };
      const step = action === "start" ? getStep(1, 1) : getNextStep(current?.game as GameNumber, current?.round as RoundNumber);

      if (!step) {
        await db
          .from("game_state")
          .update({ phase: "podium", round_ends_at: null, updated_at: new Date().toISOString() })
          .eq("id", 1);
        return NextResponse.json({ ok: true, phase: "podium" });
      }

      // Antes de arrancar la ronda, la ruleta elige 1 representante por mesa.
      const activeRepresentatives = await pickRepresentatives(db);

      await db
        .from("game_state")
        .update({
          phase: "roulette",
          current_game: step.game,
          current_round: step.round,
          round_duration_seconds: step.duration,
          round_ends_at: new Date(Date.now() + ROULETTE_DEBATE_SECONDS * 1000).toISOString(),
          active_representatives: activeRepresentatives,
          payload: {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      return NextResponse.json({ ok: true, phase: "roulette" });
    }

    case "lock": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const step = state?.current_game && state?.current_round ? getStep(state.current_game, state.current_round) : null;

      // Fin del debate de 60s tras la ruleta -> arranca el intro (Juego 3) o el timer de respuesta.
      if (state?.phase === "roulette" && step) {
        const isBrief = step.kind === "brief";
        const seconds = isBrief ? step.introDuration : step.duration;
        const { error } = await db
          .from("game_state")
          .update({
            phase: isBrief ? "intro" : "playing",
            round_ends_at: new Date(Date.now() + seconds * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1)
          .eq("phase", "roulette");
        if (!error) return NextResponse.json({ ok: true, phase: isBrief ? "intro" : "playing" });
      }

      // Fin del intro del Juego 3 (pantalla en negro) -> arranca el tiempo de respuesta.
      if (state?.phase === "intro" && step) {
        await db
          .from("game_state")
          .update({
            phase: "playing",
            round_ends_at: new Date(Date.now() + step.duration * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1)
          .eq("phase", "intro");
        return NextResponse.json({ ok: true, phase: "playing" });
      }

      // Fin del tiempo (o el representante ya respondió) -> bloquea, espera al host revelar.
      // El filtro `.eq("phase", "playing")` hace la transición atómica: si el timer y el
      // auto-lock por respuestas completas llegan casi al mismo tiempo, solo el primero
      // en llegar aplica el cambio; el segundo no afecta filas y no rompe nada.
      await db
        .from("game_state")
        .update({ phase: "locked", round_ends_at: null, updated_at: new Date().toISOString() })
        .eq("id", 1)
        .eq("phase", "playing");
      return NextResponse.json({ ok: true, phase: "locked" });
    }

    case "reveal": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const game = state?.current_game as GameNumber | null;
      const round = state?.current_round as RoundNumber | null;
      if (!game || !round) {
        return NextResponse.json({ ok: false, error: "No hay ronda activa" }, { status: 400 });
      }

      const activeRepresentatives = (state?.active_representatives ?? {}) as ActiveRepresentatives;

      const { data: teams } = await db.from("teams").select("id, name, color");
      const teamIds = (teams ?? []).map((t) => t.id);

      const { data: responses } = await db
        .from("responses")
        .select("team_id, answer")
        .eq("game_number", game)
        .eq("round_number", round);

      const input = (responses ?? []).map((r) => ({ team_id: r.team_id, answer: r.answer }));

      const scored =
        game === 1
          ? scoreGame1(input, teamIds, round)
          : game === 2
            ? scoreGame2(input, teamIds, round)
            : scoreGame3(input, teamIds, game, round);

      // Suma los puntos otorgados al puntaje acumulado de cada equipo.
      for (const r of scored.results) {
        const { data: teamRow } = await db.from("teams").select("score").eq("id", r.team_id).single();
        const newScore = (teamRow?.score ?? 0) + r.points;
        await db.from("teams").update({ score: newScore }).eq("id", r.team_id);
      }

      for (const r of scored.results) {
        await db
          .from("responses")
          .update({ points_awarded: r.points })
          .eq("game_number", game)
          .eq("round_number", round)
          .eq("team_id", r.team_id);
      }

      const reveal: RevealPayload = {
        correctAnswer: scored.correctAnswer,
        results: scored.results.map((r) => {
          const team = teams?.find((t) => t.id === r.team_id);
          return {
            team_id: r.team_id,
            team_name: team?.name ?? "—",
            color: team?.color ?? "#00F2FE",
            representative_name: activeRepresentatives[r.team_id]?.name ?? null,
            submitted: r.submitted,
            points: r.points,
          };
        }),
      };

      await db
        .from("game_state")
        .update({
          phase: "revealed",
          payload: { reveal },
          round_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      return NextResponse.json({ ok: true, phase: "revealed", reveal });
    }

    case "reset": {
      await db.from("responses").delete().neq("player_id", "00000000-0000-0000-0000-000000000000");
      // No se borra el roster: solo se "libera" (device_id = null) para que
      // cada quien pueda reclamar su nombre de nuevo en el siguiente ensayo.
      await db.from("players").update({ device_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");
      await db.from("teams").update({ score: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");
      await db
        .from("game_state")
        .update({
          phase: "lobby",
          current_game: null,
          current_round: null,
          round_ends_at: null,
          active_representatives: {},
          payload: {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      return NextResponse.json({ ok: true, phase: "lobby" });
    }

    default:
      return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
  }
}
