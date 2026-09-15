"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { getDeviceId, resetDeviceId } from "@/lib/game/device";
import { getStep } from "@/lib/game/rounds";
import type { GameStateRow, PlayerRow, TeamRow } from "@/lib/supabase/types";
import { RegistrationFlow } from "./RegistrationFlow";
import { WaitingScreen } from "./WaitingScreen";
import { SpectatorScreen } from "./SpectatorScreen";
import { SubmittedFeedback } from "./SubmittedFeedback";
import { PriceInput } from "./PriceInput";
import { CubicajeSelect } from "./CubicajeSelect";
import { BriefReconstruct } from "./BriefReconstruct";
import { Countdown } from "@/components/shared/Countdown";
import type { TruckOption } from "@/lib/game/rounds";

const DEBATE_SECONDS = 60;

export function PlayApp() {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [gameState, setGameState] = useState<GameStateRow | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const deviceId = getDeviceId();
      const { data: existing } = await supabase.from("players").select("*").eq("device_id", deviceId).maybeSingle();

      if (existing) {
        setPlayer(existing);
        const { data: teamRow } = await supabase.from("teams").select("*").eq("id", existing.team_id).single();
        if (teamRow) setTeam(teamRow);
      }

      const { data: state } = await supabase.from("game_state").select("*").eq("id", 1).single();
      if (state) setGameState(state);
      setLoading(false);
    };

    bootstrap();

    const channel = supabase
      .channel("play-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, (payload) => {
        setGameState(payload.new as GameStateRow);
        setHasAnswered(false);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "teams" }, (payload) => {
        setTeam((prev) => (prev && prev.id === (payload.new as TeamRow).id ? (payload.new as TeamRow) : prev));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Al cambiar de ronda, revisa si ya se envió respuesta (soporta refrescos de página).
  useEffect(() => {
    if (!player || !gameState?.current_game || !gameState?.current_round) return;
    let cancelled = false;

    supabase
      .from("responses")
      .select("id")
      .eq("player_id", player.id)
      .eq("game_number", gameState.current_game)
      .eq("round_number", gameState.current_round)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setHasAnswered(!!data);
      });

    return () => {
      cancelled = true;
    };
  }, [player, gameState?.current_game, gameState?.current_round]);

  const handleRegistered = (newPlayer: PlayerRow, newTeam: TeamRow) => {
    setPlayer(newPlayer);
    setTeam(newTeam);
  };

  const changeUser = useCallback(async () => {
    if (!player) return;
    if (!window.confirm(`¿Seguro que no eres ${player.name}? Vas a volver a elegir tu foto.`)) return;

    await supabase.from("players").update({ device_id: null }).eq("id", player.id);
    resetDeviceId();
    setPlayer(null);
    setTeam(null);
    setHasAnswered(false);
  }, [player]);

  const submitAnswer = useCallback(
    async (answer: unknown) => {
      if (!player || !team || !gameState?.current_game || !gameState?.current_round) return;
      setHasAnswered(true);
      const { error } = await supabase.from("responses").insert({
        player_id: player.id,
        team_id: team.id,
        game_number: gameState.current_game,
        round_number: gameState.current_round,
        answer: answer as never,
      });
      if (error && error.code !== "23505") {
        // 23505 = ya existía una respuesta (doble tap) -> se ignora, no es un error real
        setHasAnswered(false);
      }
    },
    [player, team, gameState]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-quantum-gradient font-heading text-2xl font-extrabold animate-pulse-glow">QUANTUM</p>
      </div>
    );
  }

  if (!player || !team) {
    return <RegistrationFlow onRegistered={handleRegistered} />;
  }

  if (!gameState || gameState.phase === "lobby") {
    return (
      <WaitingScreen
        team={team}
        message="¡Atento a la pantalla gigante! La partida está por comenzar…"
        playerName={player.name}
        onChangeUser={changeUser}
      />
    );
  }

  if (gameState.phase === "podium") {
    return <FinalScreen team={team} />;
  }

  const myRep = gameState.active_representatives[team.id];
  const isRepresentative = !!myRep && myRep.player_id === player.id;
  const step = getStep(gameState.current_game, gameState.current_round);

  if (gameState.phase === "roulette") {
    return (
      <WaitingScreen
        team={team}
        message={
          isRepresentative
            ? "¡Fuiste elegido/a para responder esta ronda!"
            : myRep
              ? `Le tocó a ${myRep.name} representar a tu equipo esta ronda.`
              : "La ruleta está eligiendo representante…"
        }
        playerName={player.name}
        onChangeUser={changeUser}
      >
        {myRep && (
          <>
            <p className="max-w-xs font-body text-white/50">
              {isRepresentative
                ? "Tu mesa debe ayudarte a decidir la respuesta. ¡Debatan rápido!"
                : "Acércate a su puesto y ayúdenlo/a a decidir la respuesta."}
            </p>
            <Countdown endsAt={gameState.round_ends_at} totalSeconds={DEBATE_SECONDS} size="sm" />
          </>
        )}
      </WaitingScreen>
    );
  }

  if (gameState.phase === "intro") {
    return (
      <WaitingScreen
        team={team}
        message="¡Memoriza la ficha en la pantalla gigante!"
        playerName={player.name}
        onChangeUser={changeUser}
      />
    );
  }

  if (gameState.phase === "locked") {
    return (
      <WaitingScreen
        team={team}
        message="Tiempo terminado. Calculando resultados…"
        playerName={player.name}
        onChangeUser={changeUser}
      />
    );
  }

  if (gameState.phase === "revealed") {
    const reveal = gameState.payload && "reveal" in gameState.payload ? gameState.payload.reveal : undefined;
    const mine = reveal?.results.find((r) => r.team_id === team.id);
    return (
      <WaitingScreen
        team={team}
        message={
          mine ? (mine.points > 0 ? `¡Sumaron +${mine.points} pts! 🎉` : "Esta ronda no sumó puntos.") : "Resultados en la pantalla."
        }
        playerName={player.name}
        onChangeUser={changeUser}
      />
    );
  }

  if (gameState.phase === "playing" && step) {
    if (!isRepresentative) {
      return (
        <SpectatorScreen
          team={team}
          representative={myRep}
          endsAt={gameState.round_ends_at}
          totalSeconds={gameState.round_duration_seconds}
        />
      );
    }

    if (hasAnswered) return <SubmittedFeedback />;

    return (
      <AnimatePresence mode="wait">
        <motion.div key={`${step.game}-${step.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {step.kind === "price" && <PriceInput step={step} endsAt={gameState.round_ends_at} onSubmit={(price) => submitAnswer({ price })} />}
          {step.kind === "cubicaje" && (
            <CubicajeSelect step={step} endsAt={gameState.round_ends_at} onSubmit={(code: TruckOption["code"]) => submitAnswer({ code })} />
          )}
          {step.kind === "brief" && <BriefReconstruct step={step} endsAt={gameState.round_ends_at} onSubmit={(items) => submitAnswer(items)} />}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <WaitingScreen
      team={team}
      message="Preparando la siguiente ronda…"
      playerName={player.name}
      onChangeUser={changeUser}
    />
  );
}

function FinalScreen({ team }: { team: TeamRow }) {
  const [teams, setTeams] = useState<TeamRow[]>([]);

  useEffect(() => {
    supabase
      .from("teams")
      .select("*")
      .order("score", { ascending: false })
      .then(({ data }) => data && setTeams(data));
  }, []);

  const position = teams.findIndex((t) => t.id === team.id) + 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="text-quantum-gradient font-heading text-4xl font-extrabold uppercase">¡Gracias por jugar!</p>
      {position > 0 && (
        <p className="font-heading text-xl font-bold text-white">
          {team.name} quedó en el puesto <span style={{ color: team.color }}>#{position}</span>
        </p>
      )}
      <div className="w-full max-w-xs space-y-2">
        {teams.map((t, i) => (
          <div
            key={t.id}
            className="card-quantum flex items-center justify-between px-4 py-3"
            style={{ boxShadow: t.id === team.id ? `0 0 20px ${t.color}55` : undefined }}
          >
            <span className="font-body text-sm text-white/70">
              #{i + 1} {t.name}
            </span>
            <span className="font-heading font-bold text-white">{t.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
