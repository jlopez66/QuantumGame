"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import { callAdminAction } from "@/lib/game/adminActions";
import { getStep } from "@/lib/game/rounds";
import { TeamAnswerBadges } from "./TeamAnswerBadges";
import type { GameStateRow, TeamRow } from "@/lib/supabase/types";

interface Props {
  gameState: GameStateRow;
  teams: TeamRow[];
  answeredTeamIds: Set<string>;
}

export function CubicajeRoundScreen({ gameState, teams, answeredTeamIds }: Props) {
  const step = getStep(gameState.current_game, gameState.current_round);
  if (!step || step.kind !== "cubicaje") return null;

  const reveal = gameState.payload && "reveal" in gameState.payload ? gameState.payload.reveal : undefined;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.4em] text-brand-cyan">Juego 2 · Desafío de Cubicaje</p>
        <h2 className="font-heading text-4xl font-extrabold uppercase text-white">{step.title}</h2>
      </div>

      <div className="grid flex-1 grid-cols-[1.2fr_1fr] gap-8">
        <div className="card-quantum relative overflow-hidden">
          <Image src={step.imageUrl} alt={step.montajeName} fill className="object-cover opacity-90" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
            <h3 className="font-heading text-2xl font-extrabold text-white">{step.montajeName}</h3>
            <p className="font-body text-white/70">{step.specs}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
          {gameState.phase === "playing" && (
            <Countdown endsAt={gameState.round_ends_at} totalSeconds={step.duration} onComplete={() => callAdminAction("lock")} />
          )}
          {gameState.phase === "locked" && (
            <p className="font-heading text-2xl font-bold uppercase text-brand-purple animate-pulse-glow">⏳ Cerrando votos…</p>
          )}
          {gameState.phase === "revealed" && reveal && (
            <div className="text-center">
              <p className="font-body uppercase tracking-widest text-white/50">Respuesta correcta</p>
              <p className="text-quantum-gradient font-heading text-6xl font-extrabold">{String(reveal.correctAnswer)}</p>
            </div>
          )}

          <div className="grid w-full grid-cols-2 gap-3">
            {step.options.map((opt) => (
              <div
                key={opt.code}
                className="card-quantum flex flex-col items-center gap-1 p-4"
              >
                <span className="font-heading text-xl font-extrabold text-brand-cyan">{opt.code}</span>
                <span className="text-center font-body text-sm text-white/80">{opt.label}</span>
                <span className="font-body text-xs text-white/40">{opt.m3} m³</span>
              </div>
            ))}
          </div>

          {gameState.phase === "playing" && <TeamAnswerBadges teams={teams} answeredTeamIds={answeredTeamIds} />}
        </div>
      </div>

      {gameState.phase === "revealed" && reveal && (
        <div className="grid grid-cols-5 gap-4">
          {reveal.results
            .slice()
            .sort((a, b) => b.points - a.points)
            .map((r) => (
              <motion.div
                key={r.team_id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card-quantum flex flex-col items-center gap-1 border-t-4 p-4"
                style={{ borderTopColor: r.color }}
              >
                <span className="text-center font-body text-xs text-white/60">{r.team_name}</span>
                {r.representative_name && <span className="font-body text-[0.65rem] text-white/40">{r.representative_name}</span>}
                <span className="font-heading text-lg font-extrabold text-white">{String(r.submitted ?? "—")}</span>
                {r.points > 0 && <span className="font-heading text-sm font-bold text-brand-green">+{r.points} pts</span>}
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
