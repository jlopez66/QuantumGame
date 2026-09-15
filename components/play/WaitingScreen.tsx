"use client";

import { motion } from "framer-motion";
import type { TeamRow } from "@/lib/supabase/types";

interface Props {
  team: TeamRow;
  message: string;
  children?: React.ReactNode;
  playerName?: string;
  onChangeUser?: () => void;
}

export function WaitingScreen({ team, message, children, playerName, onChangeUser }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="h-24 w-24 rounded-full"
        style={{ boxShadow: `0 0 60px ${team.color}`, backgroundColor: `${team.color}33` }}
      />
      <div className="space-y-2">
        <p className="font-body text-sm uppercase tracking-widest text-white/40">Jugando por</p>
        <p className="font-heading text-2xl font-extrabold" style={{ color: team.color }}>
          {team.name}
        </p>
      </div>
      <p className="max-w-xs font-heading text-xl font-bold uppercase text-white">{message}</p>
      {children}
      {onChangeUser && (
        <button
          onClick={onChangeUser}
          className="font-body text-xs text-white/30 underline underline-offset-2 transition hover:text-white/60"
        >
          {playerName ? `¿No eres ${playerName}? Cambiar de usuario` : "Cambiar de usuario"}
        </button>
      )}
    </div>
  );
}
