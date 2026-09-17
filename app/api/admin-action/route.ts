import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ONLINE_THRESHOLD_MS } from "@/lib/game/presence";
import { getNextStep, getStep, STEPS, type GameNumber, type RoundNumber } from "@/lib/game/rounds";
import { scoreStep } from "@/lib/game/scoring";
import type { ActiveRepresentatives, Database, RevealPayload } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Action = "start" | "lock" | "reveal" | "next" | "reset" | "start_timer" | "repeat_round";

interface Body {
  action: Action;
}

// Tiempo de debate en mesa después de que la ruleta elige representante,
// antes de que arranque el timer de respuesta (o el intro del Juego 3).
const ROULETTE_DEBATE_SECONDS = 60;

/**
 * Elige al azar 1 representante por equipo entre los jugadores que estén
 * REALMENTE en línea ahora mismo (last_seen_at reciente — ver
 * lib/game/presence.ts), no solo entre quienes alguna vez reclamaron su
 * nombre. Un equipo sin nadie conectado simplemente no aparece en el
 * resultado — esa mesa no podrá responder esta ronda (0 pts, igual que si
 * nadie hubiera contestado).
 *
 * Prioridad: dentro de cada mesa, solo se sortea entre quienes tengan el
 * `times_represented` más bajo (los que menos han salido) — así se reparte
 * el turno entre todos antes de repetir a alguien. Puede repetir a alguien
 * si ya todos en su mesa llevan el mismo número de turnos.
 */
async function pickRepresentatives(db: SupabaseClient<Database>): Promise<ActiveRepresentatives> {
  const { data: teams } = await db.from("teams").select("id");
  const onlineSince = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
  const { data: players } = await db
    .from("players")
    .select("id, team_id, name, avatar_url, times_represented")
    .not("device_id", "is", null)
    .gte("last_seen_at", onlineSince);

  const reps: ActiveRepresentatives = {};
  for (const team of teams ?? []) {
    const pool = (players ?? []).filter((p) => p.team_id === team.id);
    if (pool.length === 0) continue;
    const minTurns = Math.min(...pool.map((p) => p.times_represented));
    const priorityPool = pool.filter((p) => p.times_represented === minTurns);
    const chosen = priorityPool[Math.floor(Math.random() * priorityPool.length)];
    reps[team.id] = { player_id: chosen.id, name: chosen.name, avatar_url: chosen.avatar_url };
  }

  return reps;
}

// Separado de pickRepresentatives a propósito: solo se debe llamar DESPUÉS
// de confirmar que el UPDATE de game_state realmente tomó esta ruleta (ver
// el `.select()` + chequeo de fila afectada en "start_timer"). Si se llamara
// siempre, un doble click en "Girar Ruleta" incrementaría el contador de
// alguien por una ronda que en realidad nunca se jugó.
async function bumpTimesRepresented(db: SupabaseClient<Database>, reps: ActiveRepresentatives) {
  for (const rep of Object.values(reps)) {
    const { data: playerRow } = await db.from("players").select("times_represented").eq("id", rep.player_id).single();
    await db
      .from("players")
      .update({ times_represented: (playerRow?.times_represented ?? 0) + 1 })
      .eq("id", rep.player_id);
  }
}

export async function POST(req: Request) {
  let action: Action | undefined;
  try {
    ({ action } = (await req.json()) as Body);
    const db = createAdminClient();
    return await handleAction(action, db);
  } catch (err) {
    // Todo el cuerpo va dentro del try (incluyendo req.json() y
    // createAdminClient()) a propósito: si cualquiera de esos dos falla antes
    // de llegar aquí, Next devuelve su propia página de error en texto plano
    // ("Internal Server Error"), no JSON — y el cliente truena al intentar
    // parsearla. Con el catch envolviendo todo, siempre respondemos JSON.
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[admin-action]", action ?? "?", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function handleAction(action: Action, db: SupabaseClient<Database>) {
  switch (action) {
    case "start":
    case "next": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const current =
        action === "start" ? null : { game: state?.current_game ?? null, round: state?.current_round ?? null };
      const step = action === "start" ? STEPS[0] : getNextStep(current?.game as GameNumber, current?.round as RoundNumber);

      if (!step) {
        await db
          .from("game_state")
          .update({ phase: "podium", round_ends_at: null, updated_at: new Date().toISOString() })
          .eq("id", 1);
        return NextResponse.json({ ok: true, phase: "podium" });
      }

      // La ruleta todavía NO elige representante aquí: entra a la fase
      // `roulette` con active_representatives vacío y el conteo en pausa. El
      // host debe presionar "Girar Ruleta" (acción start_timer) para que
      // recién ahí se elija a alguien y arranque la animación + el debate.
      const { error } = await db
        .from("game_state")
        .update({
          phase: "roulette",
          current_game: step.game,
          current_round: step.round,
          round_duration_seconds: step.duration,
          round_ends_at: null,
          active_representatives: {},
          payload: {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw new Error(`No se pudo iniciar la ronda: ${error.message}`);

      return NextResponse.json({ ok: true, phase: "roulette" });
    }

    case "lock": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const step =
        state?.current_game != null && state?.current_round != null ? getStep(state.current_game, state.current_round) : null;

      // Fin del debate de 60s tras la ruleta -> entra a la pregunta, pero el
      // conteo se queda en pausa (round_ends_at = null) hasta que el host
      // presione "Iniciar Conteo" (acción start_timer) — así puede leer la
      // pregunta en voz alta (o dejar correr el GIF del Juego 3) sin que el
      // tiempo de respuesta ya esté corriendo. Si la ronda declara `media` +
      // `introDuration` (hoy, el Juego 3), primero pasa por la fase `intro`
      // para proyectar esa animación antes de mostrar la pregunta.
      if (state?.phase === "roulette" && step) {
        const hasIntro = step.introDuration != null;
        const { error } = await db
          .from("game_state")
          .update({
            phase: hasIntro ? "intro" : "playing",
            round_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1)
          .eq("phase", "roulette");
        if (!error) return NextResponse.json({ ok: true, phase: hasIntro ? "intro" : "playing" });
      }

      // Fin del intro (GIF del Juego 3) -> arranca el tiempo de respuesta.
      if (state?.phase === "intro" && step) {
        const { error: introError } = await db
          .from("game_state")
          .update({
            phase: "playing",
            round_ends_at: new Date(Date.now() + step.duration * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1)
          .eq("phase", "intro");
        if (introError) throw new Error(introError.message);
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

    // El host presiona esto cuando está listo para que arranque el conteo
    // visible (round_ends_at) tanto en /admin como en /play. Antes de esto,
    // `round_ends_at` es null y el componente Countdown simplemente muestra
    // el tiempo total sin moverse.
    case "start_timer": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();

      if (state?.round_ends_at != null) {
        return NextResponse.json({ ok: false, error: "No hay un conteo pendiente de iniciar" }, { status: 400 });
      }

      // Fase `roulette`: "Girar Ruleta" — recién aquí se elige 1 representante
      // por mesa (antes nadie sabe quién va a responder) y arranca el debate.
      if (state?.phase === "roulette") {
        const activeRepresentatives = await pickRepresentatives(db);
        const { data: updated, error } = await db
          .from("game_state")
          .update({
            active_representatives: activeRepresentatives,
            round_ends_at: new Date(Date.now() + ROULETTE_DEBATE_SECONDS * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1)
          .eq("phase", "roulette")
          .is("round_ends_at", null) // evita que un doble click vuelva a sortear representante
          .select();
        if (error) throw new Error(error.message);
        // Si no afectó ninguna fila, otro click (o el auto-avance) ya ganó la
        // carrera — no hay que sumarle un turno a nadie por un sorteo descartado.
        if (updated && updated.length > 0) await bumpTimesRepresented(db, activeRepresentatives);
        return NextResponse.json({ ok: true, phase: "roulette" });
      }

      const step =
        state?.current_game != null && state?.current_round != null ? getStep(state.current_game, state.current_round) : null;

      if (!step || (state?.phase !== "intro" && state?.phase !== "playing")) {
        return NextResponse.json({ ok: false, error: "No hay un conteo pendiente de iniciar" }, { status: 400 });
      }

      const seconds = state.phase === "intro" && step.introDuration != null ? step.introDuration : step.duration;

      const { error } = await db
        .from("game_state")
        .update({ round_ends_at: new Date(Date.now() + seconds * 1000).toISOString(), updated_at: new Date().toISOString() })
        .eq("id", 1)
        .is("round_ends_at", null); // evita que un doble click reinicie el conteo ya arrancado

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, phase: state.phase });
    }

    case "reveal": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const game = state?.current_game as GameNumber | null;
      const round = state?.current_round as RoundNumber | null;
      const step = game != null && round != null ? getStep(game, round) : null;
      if (game == null || round == null || !step) {
        return NextResponse.json({ ok: false, error: "No hay ronda activa" }, { status: 400 });
      }
      if (state?.phase !== "locked") {
        // Evita sumar los puntos dos veces si "reveal" se dispara más de una
        // vez para la misma ronda (doble click, dos pestañas de /admin, etc.).
        return NextResponse.json({ ok: false, error: "Esta ronda ya fue revelada" }, { status: 400 });
      }

      const activeRepresentatives = (state?.active_representatives ?? {}) as ActiveRepresentatives;

      const { data: teams } = await db.from("teams").select("id, name, color");
      const teamIds = (teams ?? []).map((t) => t.id);

      const { data: responses } = await db
        .from("responses")
        .select("team_id, answer, created_at")
        .eq("game_number", game)
        .eq("round_number", round);

      const input = (responses ?? []).map((r) => ({ team_id: r.team_id, answer: r.answer, created_at: r.created_at }));

      const scored = scoreStep(step, input, teamIds);

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
        adminFunFact: scored.adminFunFact,
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
        .eq("id", 1)
        .eq("phase", "locked");

      return NextResponse.json({ ok: true, phase: "revealed", reveal });
    }

    // El host lo presiona en la fase `revealed` cuando algo salió mal con esa
    // pregunta específica (error de contenido, etc.): descuenta los puntos ya
    // otorgados en ESA ronda, borra las respuestas, libera a los
    // representantes que salieron (para que la ruleta los pueda priorizar de
    // nuevo) y vuelve a la fase `roulette` para repetir la misma ronda desde cero.
    case "repeat_round": {
      const { data: state } = await db.from("game_state").select("*").eq("id", 1).single();
      const game = state?.current_game;
      const round = state?.current_round;

      if (game == null || round == null || state?.phase !== "revealed") {
        return NextResponse.json({ ok: false, error: "Solo puedes repetir una ronda que ya fue revelada" }, { status: 400 });
      }

      const reveal = state?.payload && "reveal" in state.payload ? state.payload.reveal : undefined;
      if (reveal) {
        for (const r of reveal.results) {
          if (r.points <= 0) continue;
          const { data: teamRow } = await db.from("teams").select("score").eq("id", r.team_id).single();
          await db
            .from("teams")
            .update({ score: Math.max(0, (teamRow?.score ?? 0) - r.points) })
            .eq("id", r.team_id);
        }
      }

      const activeRepresentatives = (state?.active_representatives ?? {}) as ActiveRepresentatives;
      for (const rep of Object.values(activeRepresentatives)) {
        const { data: playerRow } = await db.from("players").select("times_represented").eq("id", rep.player_id).single();
        await db
          .from("players")
          .update({ times_represented: Math.max(0, (playerRow?.times_represented ?? 0) - 1) })
          .eq("id", rep.player_id);
      }

      await db.from("responses").delete().eq("game_number", game).eq("round_number", round);

      const { error } = await db
        .from("game_state")
        .update({
          phase: "roulette",
          round_ends_at: null,
          active_representatives: {},
          payload: {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, phase: "roulette" });
    }

    case "reset": {
      await db.from("responses").delete().neq("player_id", "00000000-0000-0000-0000-000000000000");
      // No se borra el roster: solo se "libera" (device_id = null) para que
      // cada quien pueda reclamar su nombre de nuevo en el siguiente ensayo.
      await db
        .from("players")
        .update({ device_id: null, times_represented: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000");
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
