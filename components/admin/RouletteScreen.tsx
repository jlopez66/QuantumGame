"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import { callAdminAction } from "@/lib/game/adminActions";
import { getAvatarUrl } from "@/lib/game/avatar";
import { DEPARTMENTS } from "@/lib/game/departments";
import { getStep } from "@/lib/game/rounds";
import type { ActiveRepresentative, GameStateRow, PlayerRow, TeamRow } from "@/lib/supabase/types";

const SPIN_BASE_MS = 2200;
const SPIN_STAGGER_MS = 450;
const SPIN_TICK_MS = 90;
const DEBATE_SECONDS = 60;

interface Props {
  gameState: GameStateRow;
  teams: TeamRow[];
  players: PlayerRow[];
}

export function RouletteScreen({ gameState, teams, players }: Props) {
  const step = getStep(gameState.current_game, gameState.current_round);
  const columnCount = DEPARTMENTS.filter((d) => teams.some((t) => t.slug === d.slug)).length;
  const [doneCount, setDoneCount] = useState(0);
  const allDone = columnCount > 0 && doneCount >= columnCount;

  // Cada vez que entra una nueva ronda a esta pantalla, se reinicia el conteo de columnas.
  useEffect(() => {
    setDoneCount(0);
  }, [gameState.current_game, gameState.current_round]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <div className="text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.4em] text-brand-cyan">
          {step?.title ?? "Nueva Ronda"}
        </p>
        <h2 className="text-quantum-gradient font-heading text-5xl font-extrabold uppercase">
          ¡Girando la Ruleta de Representantes!
        </h2>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-5 gap-4">
        {DEPARTMENTS.map((dept, i) => {
          const team = teams.find((t) => t.slug === dept.slug);
          if (!team) return null;
          const pool = players.filter((p) => p.team_id === team.id && p.device_id);
          const winner = gameState.active_representatives[team.id];
          return (
            <RouletteColumn
              key={`${team.id}-${gameState.current_game}-${gameState.current_round}`}
              team={team}
              pool={pool}
              winner={winner}
              spinDurationMs={SPIN_BASE_MS + i * SPIN_STAGGER_MS}
              onDone={() => setDoneCount((c) => c + 1)}
            />
          );
        })}
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <p className="font-heading text-2xl font-extrabold uppercase text-white">
            ¡Tienen {DEBATE_SECONDS} segundos para debatir en mesa!
          </p>
          <Countdown
            endsAt={gameState.round_ends_at}
            totalSeconds={DEBATE_SECONDS}
            size="sm"
            onComplete={() => callAdminAction("lock")}
          />
        </motion.div>
      )}
    </div>
  );
}

interface ColumnProps {
  team: TeamRow;
  pool: PlayerRow[];
  winner: ActiveRepresentative | undefined;
  spinDurationMs: number;
  onDone: () => void;
}

function RouletteColumn({ team, pool, winner, spinDurationMs, onDone }: ColumnProps) {
  const [spinning, setSpinning] = useState(pool.length > 0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;

    if (pool.length === 0) {
      setSpinning(false);
      firedRef.current = true;
      onDone();
      return;
    }

    const tick = setInterval(() => {
      setDisplayIdx((i) => (i + 1) % pool.length);
    }, SPIN_TICK_MS);

    const stop = setTimeout(() => {
      clearInterval(tick);
      setSpinning(false);
      if (!firedRef.current) {
        firedRef.current = true;
        onDone();
      }
    }, spinDurationMs);

    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, spinDurationMs]);

  const displayed = spinning ? pool[displayIdx] : null;
  const finalName = winner?.name ?? (pool.length === 0 ? "Sin jugadores" : "—");
  const finalAvatar = winner ? getAvatarUrl(winner.name, winner.avatar_url) : null;

  return (
    <div className="card-quantum flex flex-col items-center gap-3 border-t-4 p-4" style={{ borderTopColor: team.color }}>
      <span className="font-body text-xs uppercase tracking-wide text-white/50">{team.name}</span>

      <div
        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2"
        style={{
          borderColor: spinning ? "rgba(255,255,255,0.2)" : team.color,
          boxShadow: spinning ? undefined : `0 0 25px ${team.color}`,
        }}
      >
        {spinning && displayed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getAvatarUrl(displayed.name, displayed.avatar_url)} alt="" className="h-full w-full object-cover" />
        )}
        {!spinning && finalAvatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={finalAvatar} alt="" className="h-full w-full object-cover" />
        )}
        {!spinning && !finalAvatar && <span className="text-2xl">🎲</span>}
      </div>

      <span className="h-10 text-center font-heading text-sm font-bold leading-tight text-white">
        {spinning ? (displayed?.name ?? "…") : finalName}
      </span>
    </div>
  );
}
