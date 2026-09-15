"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { DEPARTMENTS } from "@/lib/game/departments";
import type { PlayerRow, TeamRow } from "@/lib/supabase/types";

interface Props {
  teams: TeamRow[];
  players: PlayerRow[];
}

export function LobbyScreen({ teams, players }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const playUrl = `${siteUrl}/play`;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-12">
      <div className="text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.5em] text-brand-cyan">
          Brandex presenta el lanzamiento de
        </p>
        <h1 className="text-quantum-gradient font-heading text-8xl font-extrabold uppercase">Quantum</h1>
      </div>

      <div className="flex items-center gap-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="card-quantum glow-border p-6"
        >
          <QRCodeSVG value={playUrl} size={280} bgColor="#111111" fgColor="#ffffff" level="M" includeMargin />
        </motion.div>

        <div className="max-w-sm space-y-4">
          <h2 className="font-heading text-3xl font-extrabold uppercase text-white">Escanea y únete</h2>
          <p className="font-body text-white/60">
            Abre la cámara de tu celular, escanea el código y elige tu departamento. ¡La partida comienza pronto!
          </p>
          <p className="font-heading text-xl font-bold text-brand-green">{playUrl.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-5 gap-4">
        {DEPARTMENTS.map((dept) => {
          const team = teams.find((t) => t.slug === dept.slug);
          const count = players.filter((p) => p.team_id === team?.id).length;
          return (
            <motion.div
              key={dept.slug}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="card-quantum flex flex-col items-center gap-2 border-t-4 p-5"
              style={{ borderTopColor: dept.color }}
            >
              <span className="font-heading text-4xl font-extrabold" style={{ color: dept.color }}>
                {count}
              </span>
              <span className="text-center font-body text-sm text-white/70">{dept.name}</span>
            </motion.div>
          );
        })}
      </div>

      <p className="font-body text-white/40">{players.length} / 60 jugadores conectados</p>
    </div>
  );
}
