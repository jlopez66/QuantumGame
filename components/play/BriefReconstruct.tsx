"use client";

import { useState } from "react";
import { Countdown } from "@/components/shared/Countdown";
import type { BriefStep } from "@/lib/game/rounds";

interface Props {
  step: BriefStep;
  endsAt: string | null;
  onSubmit: (items: string[]) => Promise<void>;
}

export function BriefReconstruct({ step, endsAt, onSubmit }: Props) {
  const [answers, setAnswers] = useState<string[]>(Array(step.items.length).fill(""));
  const [sending, setSending] = useState(false);

  const complete = answers.every(Boolean);

  const submit = async () => {
    if (!complete || sending) return;
    setSending(true);
    await onSubmit(answers);
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-brand-cyan">Juego 3</p>
          <h2 className="font-heading text-xl font-extrabold text-white">Reconstruye el brief</h2>
        </div>
        <Countdown endsAt={endsAt} totalSeconds={step.duration} size="sm" />
      </div>

      <p className="font-body text-sm text-white/60">Pantalla en negro — respondan de memoria.</p>

      <div className="flex flex-1 flex-col gap-4">
        {step.slotOptions.map((options, slotIdx) => (
          <div key={slotIdx} className="space-y-2">
            <p className="font-body text-xs uppercase tracking-widest text-white/40">Elemento {slotIdx + 1}</p>
            <select
              value={answers[slotIdx]}
              onChange={(e) =>
                setAnswers((prev) => prev.map((a, i) => (i === slotIdx ? e.target.value : a)))
              }
              className="w-full rounded-2xl border border-white/15 bg-brand-dark px-4 py-4 font-body text-white outline-none focus:border-brand-cyan"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button disabled={!complete || sending} onClick={submit} className="btn-quantum w-full py-5 text-xl shadow-neon-cyan">
        {sending ? "Enviando…" : "Enviar Respuesta del Equipo"}
      </button>
    </div>
  );
}
