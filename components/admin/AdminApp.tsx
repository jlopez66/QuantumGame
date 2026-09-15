"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { callAdminAction } from "@/lib/game/adminActions";
import type { GameStateRow, PlayerRow, TeamRow, ResponseRow } from "@/lib/supabase/types";
import { QuantumLogo } from "@/components/shared/QuantumLogo";
import { ConnectionBadge } from "@/components/shared/ConnectionBadge";
import { LobbyScreen } from "./LobbyScreen";
import { RouletteScreen } from "./RouletteScreen";
import { PriceRoundScreen } from "./PriceRoundScreen";
import { CubicajeRoundScreen } from "./CubicajeRoundScreen";
import { BriefRoundScreen } from "./BriefRoundScreen";
import { PodiumScreen } from "./PodiumScreen";
import { ControlBar } from "./ControlBar";
import { LeaderboardSidebar } from "./Leaderboard";

export function AdminApp() {
  const [gameState, setGameState] = useState<GameStateRow | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);

  const refetchAll = useCallback(async () => {
    const [stateRes, teamsRes, playersRes] = await Promise.all([
      supabase.from("game_state").select("*").eq("id", 1).single(),
      supabase.from("teams").select("*").order("score", { ascending: false }),
      supabase.from("players").select("*"),
    ]);
    if (stateRes.data) setGameState(stateRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
  }, []);

  useEffect(() => {
    refetchAll();

    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, (payload) => {
        setGameState(payload.new as GameStateRow);
        setResponses([]); // nueva ronda -> limpiar el conteo de respuestas en vivo
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => {
        refetchAll();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "players" }, (payload) => {
        setPlayers((prev) => [...prev, payload.new as PlayerRow]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses" }, (payload) => {
        setResponses((prev) => [...prev, payload.new as ResponseRow]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchAll]);

  // Equipos que ya registraron al menos una respuesta para la ronda activa.
  const answeredTeamIds = useMemo(() => {
    if (!gameState?.current_game || !gameState?.current_round) return new Set<string>();
    return new Set(
      responses
        .filter((r) => r.game_number === gameState.current_game && r.round_number === gameState.current_round)
        .map((r) => r.team_id)
    );
  }, [responses, gameState?.current_game, gameState?.current_round]);

  // Auto-lock: en cuanto los 5 equipos respondieron, corta el timer y bloquea sin
  // esperar a que se agote la cuenta regresiva. `autoLockedRoundRef` evita disparar
  // la acción más de una vez para la misma ronda (los eventos realtime pueden llegar
  // varias veces mientras el Set sigue en 5/5).
  const autoLockedRoundRef = useRef<string | null>(null);

  useEffect(() => {
    if (!gameState || gameState.phase !== "playing") return;
    if (teams.length === 0 || answeredTeamIds.size < teams.length) return;

    const roundKey = `${gameState.current_game}-${gameState.current_round}`;
    if (autoLockedRoundRef.current === roundKey) return;
    autoLockedRoundRef.current = roundKey;

    callAdminAction("lock");
  }, [gameState, teams.length, answeredTeamIds]);

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <QuantumLogo className="text-4xl animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-4">
        <QuantumLogo className="text-3xl" />
        <ConnectionBadge />
      </header>

      <div className="relative flex flex-1">
        <main className="flex-1 overflow-hidden px-8 py-6">
          <AnimatePresence mode="wait">
            {gameState.phase === "lobby" && (
              <motion.div key="lobby" {...fadeProps} className="h-full">
                <LobbyScreen teams={teams} players={players} />
              </motion.div>
            )}

            {gameState.phase === "roulette" && (
              <motion.div key="roulette" {...fadeProps} className="h-full">
                <RouletteScreen gameState={gameState} teams={teams} players={players} />
              </motion.div>
            )}

            {!["lobby", "podium", "roulette"].includes(gameState.phase) && gameState.current_game === 1 && (
              <motion.div key="game1" {...fadeProps} className="h-full">
                <PriceRoundScreen gameState={gameState} teams={teams} answeredTeamIds={answeredTeamIds} />
              </motion.div>
            )}

            {!["lobby", "podium", "roulette"].includes(gameState.phase) && gameState.current_game === 2 && (
              <motion.div key="game2" {...fadeProps} className="h-full">
                <CubicajeRoundScreen gameState={gameState} teams={teams} answeredTeamIds={answeredTeamIds} />
              </motion.div>
            )}

            {!["lobby", "podium", "roulette"].includes(gameState.phase) && gameState.current_game === 3 && (
              <motion.div key="game3" {...fadeProps} className="h-full">
                <BriefRoundScreen gameState={gameState} teams={teams} answeredTeamIds={answeredTeamIds} />
              </motion.div>
            )}

            {gameState.phase === "podium" && (
              <motion.div key="podium" {...fadeProps} className="h-full">
                <PodiumScreen teams={teams} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {gameState.phase !== "lobby" && gameState.phase !== "podium" && (
          <LeaderboardSidebar teams={teams} />
        )}
      </div>

      <ControlBar gameState={gameState} />
    </div>
  );
}

const fadeProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};
