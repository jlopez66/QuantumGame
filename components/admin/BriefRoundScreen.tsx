"use client";

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

export function BriefRoundScreen({ gameState, teams, answeredTeamIds }: Props) {
  const step = getStep(gameState.current_game, gameState.current_round);
  if (!step || step.kind !== "brief") return null;

  const reveal = gameState.payload && "reveal" in gameState.payload ? gameState.payload.reveal : undefined;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.4em] text-brand-cyan">Juego 3 · Reconstructor de Brief</p>
        <h2 className="font-heading text-4xl font-extrabold uppercase text-white">{step.title}</h2>
      </div>

      {gameState.phase === "intro" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <h3 className="font-heading text-3xl font-bold text-white">{step.eventName}</h3>
          <div className="grid grid-cols-2 gap-6">
            {step.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="card-quantum glow-border px-10 py-8 text-center"
              >
                <span className="font-heading text-2xl font-extrabold text-white">{item}</span>
              </motion.div>
            ))}
          </div>
          <Countdown endsAt={gameState.round_ends_at} totalSeconds={step.introDuration} size="sm" onComplete={() => callAdminAction("lock")} />
          <p className="font-body text-white/50">¡Memoricen! La pantalla se apagará en breve…</p>
        </div>
      )}

      {gameState.phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-black">
          <Countdown endsAt={gameState.round_ends_at} totalSeconds={step.duration} onComplete={() => callAdminAction("lock")} />
          <p className="font-heading text-2xl font-bold uppercase text-white/70">Reconstruyan el brief a ciegas</p>
          <TeamAnswerBadges teams={teams} answeredTeamIds={answeredTeamIds} />
        </div>
      )}

      {gameState.phase === "locked" && (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-heading text-2xl font-bold uppercase text-brand-purple animate-pulse-glow">⏳ Revisando memorias…</p>
        </div>
      )}

      {gameState.phase === "revealed" && reveal && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <h3 className="font-heading text-2xl font-bold text-white">Brief real: {step.eventName}</h3>
          <div className="grid grid-cols-2 gap-4">
            {step.items.map((item, i) => (
              <div key={i} className="card-quantum border border-brand-green/40 px-8 py-5 text-center">
                <span className="font-heading text-lg font-extrabold text-brand-green">{item}</span>
              </div>
            ))}
          </div>
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
                  <span className="font-heading text-lg font-extrabold text-brand-green">+{r.points} pts</span>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
