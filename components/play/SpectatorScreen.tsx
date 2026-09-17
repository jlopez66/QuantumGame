"use client";

import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import { getAvatarUrl } from "@/lib/game/avatar";
import type { ActiveRepresentative, TeamRow } from "@/lib/supabase/types";

interface Props {
  team: TeamRow;
  representative: ActiveRepresentative | undefined;
  endsAt: string | null;
  totalSeconds: number;
}

export function SpectatorScreen({ team, representative, endsAt, totalSeconds }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      {representative ? (
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={getAvatarUrl(representative.name, representative.avatar_url)}
          alt={representative.name}
          className="h-28 w-28 rounded-full border-4"
          style={{ borderColor: team.color, boxShadow: `0 0 40px ${team.color}` }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getAvatarUrl(representative.name);
          }}
        />
      ) : (
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full border-4 text-4xl"
          style={{ borderColor: team.color }}
        >
          🤷
        </div>
      )}

      <div className="space-y-2">
        <p className="font-body text-sm uppercase tracking-widest text-white/40">Jugando por</p>
        <p className="font-heading text-xl font-extrabold" style={{ color: team.color }}>
          {team.name}
        </p>
      </div>

      <p className="max-w-xs font-heading text-2xl font-extrabold uppercase text-white">
        {representative
          ? `¡En esta ronda responde ${representative.name}!`
          : "Nadie de tu equipo puede responder esta ronda."}
      </p>
      <p className="max-w-xs font-body text-white/60">
        {representative
          ? "Ya está al frente respondiendo por el equipo — anímalo/a desde tu puesto."
          : "Anímalos desde tu puesto — la próxima ronda la ruleta puede elegirte a ti."}
      </p>

      {endsAt && <Countdown endsAt={endsAt} totalSeconds={totalSeconds} size="sm" />}
    </div>
  );
}
