"use client";

import { motion } from "framer-motion";
import type { TeamRow } from "@/lib/supabase/types";

export function LeaderboardSidebar({ teams }: { teams: TeamRow[] }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <aside className="hidden w-72 shrink-0 border-l border-white/10 px-5 py-6 lg:block">
      <h3 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.3em] text-white/40">Marcador</h3>
      <ol className="space-y-3">
        {sorted.map((team, i) => (
          <motion.li
            key={team.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="card-quantum flex items-center gap-3 px-4 py-3"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-heading text-sm font-extrabold text-black"
              style={{ backgroundColor: team.color }}
            >
              {i + 1}
            </span>
            <span className="flex-1 truncate font-body text-sm text-white/80">{team.name}</span>
            <span className="font-heading text-lg font-extrabold text-white">{team.score}</span>
          </motion.li>
        ))}
      </ol>
    </aside>
  );
}
