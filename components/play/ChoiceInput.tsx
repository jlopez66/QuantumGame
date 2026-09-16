"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import type { BinaryChoiceStep, MultipleChoiceStep } from "@/lib/game/rounds";

interface Props {
  step: BinaryChoiceStep | MultipleChoiceStep;
  endsAt: string | null;
  onSubmit: (choice: string) => Promise<void>;
}

export function ChoiceInput({ step, endsAt, onSubmit }: Props) {
  const [sending, setSending] = useState<string | null>(null);

  const pick = async (choice: string) => {
    if (sending) return;
    setSending(choice);
    await onSubmit(choice);
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-brand-cyan">
            Juego {step.game}
            {step.points > 0 && ` · ${step.points} pts`}
          </p>
          <h2 className="font-heading text-xl font-extrabold text-white">{step.title}</h2>
        </div>
        <Countdown endsAt={endsAt} totalSeconds={step.duration} size="sm" />
      </div>

      <p className="font-body text-sm text-white/70">{step.question}</p>

      <div className="mt-4 flex flex-1 flex-col justify-center gap-4">
        {step.options.map((opt) => (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.96 }}
            disabled={!!sending}
            onClick={() => pick(opt)}
            className="card-quantum glow-border flex items-center justify-center px-5 py-8 text-center disabled:opacity-50"
            style={{ boxShadow: sending === opt ? "0 0 30px #00FF87" : undefined }}
          >
            <span className="font-heading text-2xl font-extrabold text-white">{opt}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
