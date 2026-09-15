"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import { callAdminAction } from "@/lib/game/adminActions";
import { getStep } from "@/lib/game/rounds";
import { TeamAnswerBadges } from "./TeamAnswerBadges";
import type { GameStateRow, TeamRow } from "@/lib/supabase/types";

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

interface Props {
  gameState: GameStateRow;
  teams: TeamRow[];
  answeredTeamIds: Set<string>;
}

export function PriceRoundScreen({ gameState, teams, answeredTeamIds }: Props) {
  const step = getStep(gameState.current_game, gameState.current_round);
  if (!step || step.kind !== "price") return null;

  const reveal = gameState.payload && "reveal" in gameState.payload ? gameState.payload.reveal : undefined;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.4em] text-brand-cyan">Juego 1 · El Precio Exacto</p>
        <h2 className="font-heading text-4xl font-extrabold uppercase text-white">{step.title}</h2>
      </div>

      <div className="grid flex-1 grid-cols-[1.2fr_1fr] gap-8">
        <div className="card-quantum relative overflow-hidden">
          <Image src={step.imageUrl} alt={step.comboName} fill className="object-cover opacity-90" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
            <h3 className="font-heading text-2xl font-extrabold text-white">{step.comboName}</h3>
            <p className="font-body text-white/70">{step.comboDescription}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
          {gameState.phase === "playing" && (
            <>
              <Countdown endsAt={gameState.round_ends_at} totalSeconds={step.duration} onComplete={() => callAdminAction("lock")} />
              <TeamAnswerBadges teams={teams} answeredTeamIds={answeredTeamIds} />
            </>
          )}

          {gameState.phase === "locked" && (
            <p className="font-heading text-2xl font-bold uppercase text-brand-purple animate-pulse-glow">
              ⏳ Calculando cotizaciones…
            </p>
          )}

          {gameState.phase === "revealed" && reveal && typeof reveal.correctAnswer === "number" && (
            <div className="text-center">
              <p className="font-body uppercase tracking-widest text-white/50">Valor real</p>
              <p className="text-quantum-gradient font-heading text-5xl font-extrabold">{COP.format(reveal.correctAnswer)}</p>
            </div>
          )}
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
                <span className="font-heading text-lg font-extrabold text-white">
                  {typeof r.submitted === "number" ? COP.format(Math.round(r.submitted)) : "Sin respuesta"}
                </span>
                {r.points > 0 && <span className="font-heading text-sm font-bold text-brand-green">+{r.points} pts</span>}
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
