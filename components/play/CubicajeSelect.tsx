"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import type { CubicajeStep, TruckOption } from "@/lib/game/rounds";

interface Props {
  step: CubicajeStep;
  endsAt: string | null;
  onSubmit: (code: TruckOption["code"]) => Promise<void>;
}

const TRUCK_EMOJI: Record<TruckOption["icon"], string> = {
  nhr: "🚐",
  turbo: "🚚",
  "10ton": "🚛",
  "2turbos": "🚚🚚",
};

export function CubicajeSelect({ step, endsAt, onSubmit }: Props) {
  const [sending, setSending] = useState<string | null>(null);

  const pick = async (code: TruckOption["code"]) => {
    if (sending) return;
    setSending(code);
    await onSubmit(code);
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-brand-cyan">Juego 2</p>
          <h2 className="font-heading text-xl font-extrabold text-white">{step.montajeName}</h2>
        </div>
        <Countdown endsAt={endsAt} totalSeconds={step.duration} size="sm" />
      </div>

      <p className="font-body text-sm text-white/60">{step.specs}</p>

      <div className="mt-4 grid flex-1 grid-cols-1 gap-4">
        {step.options.map((opt) => (
          <motion.button
            key={opt.code}
            whileTap={{ scale: 0.96 }}
            disabled={!!sending}
            onClick={() => pick(opt.code)}
            className="card-quantum glow-border flex items-center gap-4 px-5 py-5 text-left disabled:opacity-50"
            style={{ boxShadow: sending === opt.code ? "0 0 30px #00FF87" : undefined }}
          >
            <span className="text-4xl">{TRUCK_EMOJI[opt.icon]}</span>
            <div className="flex-1">
              <p className="font-heading text-lg font-extrabold text-white">
                {opt.code}) {opt.label}
              </p>
              <p className="font-body text-sm text-white/50">{opt.m3} m³</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
