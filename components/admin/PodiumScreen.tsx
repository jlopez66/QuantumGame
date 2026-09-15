"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { TeamRow } from "@/lib/supabase/types";

export function PodiumScreen({ teams }: { teams: TeamRow[] }) {
  const fired = useRef(false);
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const [first, second, third, ...rest] = sorted;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#00F2FE", "#4FACFE", "#00FF87"];

    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors, startVelocity: 45 });
  }, []);

  const podiumHeights = ["h-56", "h-72", "h-40"]; // 2do, 1ro, 3ro (orden visual del podio)
  const order = [second, first, third];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <h2 className="text-quantum-gradient text-center font-heading text-6xl font-extrabold uppercase">Ganadores QUANTUM</h2>

      <div className="flex items-end gap-6">
        {order.map((team, i) =>
          team ? (
            <motion.div
              key={team.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.25, type: "spring", stiffness: 120 }}
              className="flex w-48 flex-col items-center gap-3"
            >
              <span className="font-heading text-lg font-bold text-white">{team.name}</span>
              <span className="font-heading text-3xl font-extrabold" style={{ color: team.color }}>
                {team.score} pts
              </span>
              <div
                className={`flex ${podiumHeights[i]} w-full items-start justify-center rounded-t-2xl border-t-4 pt-4`}
                style={{ borderTopColor: team.color, backgroundColor: `${team.color}22` }}
              >
                <span className="font-heading text-5xl font-extrabold text-white">{i === 1 ? "1" : i === 0 ? "2" : "3"}</span>
              </div>
            </motion.div>
          ) : null
        )}
      </div>

      {rest.length > 0 && (
        <div className="flex gap-4">
          {rest.map((team, i) => (
            <div key={team.id} className="card-quantum px-6 py-3 text-center">
              <p className="font-body text-xs uppercase text-white/50">#{i + 4}</p>
              <p className="font-heading font-bold text-white">{team.name}</p>
              <p className="font-body text-sm text-white/60">{team.score} pts</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
