"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TeamRow } from "@/lib/supabase/types";

interface Props {
  teams: TeamRow[];
  answeredTeamIds: Set<string>;
}

export function TeamAnswerBadges({ teams, answeredTeamIds }: Props) {
  const answeredCount = teams.filter((t) => answeredTeamIds.has(t.id)).length;
  const allAnswered = teams.length > 0 && answeredCount === teams.length;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-heading text-lg font-bold uppercase text-white/70">
        Respuestas recibidas: <span className="text-brand-green">{answeredCount}</span> / {teams.length} equipos
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {teams.map((team) => {
          const answered = answeredTeamIds.has(team.id);
          return (
            <motion.div
              key={team.id}
              animate={answered ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="card-quantum flex items-center gap-2 border px-4 py-2 transition-colors"
              style={{ borderColor: answered ? "#00FF87" : "rgba(255,255,255,0.1)" }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
              <span className="font-body text-sm text-white/80">{team.name}</span>
              <AnimatePresence>
                {answered && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-black"
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {allAnswered && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-quantum-gradient text-center font-heading text-xl font-extrabold uppercase animate-pulse-glow"
          >
            ¡Todos los equipos han respondido! Revelando resultados…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
