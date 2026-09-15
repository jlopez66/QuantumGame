"use client";

import { useState } from "react";
import { Countdown } from "@/components/shared/Countdown";
import type { PriceStep } from "@/lib/game/rounds";

interface Props {
  step: PriceStep;
  endsAt: string | null;
  onSubmit: (price: number) => Promise<void>;
}

const digitsOnly = (v: string) => v.replace(/\D/g, "");
const formatCOP = (v: string) => (v ? Number(v).toLocaleString("es-CO") : "");

export function PriceInput({ step, endsAt, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!value || sending) return;
    setSending(true);
    await onSubmit(Number(value));
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-brand-cyan">Juego 1</p>
          <h2 className="font-heading text-xl font-extrabold text-white">{step.comboName}</h2>
        </div>
        <Countdown endsAt={endsAt} totalSeconds={step.duration} size="sm" />
      </div>

      <p className="font-body text-sm text-white/60">{step.comboDescription}</p>

      <div className="mt-4 flex flex-1 flex-col justify-center gap-4">
        <label className="text-center font-body text-sm uppercase tracking-widest text-white/40">
          ¿Cuánto cuesta este combo? (COP)
        </label>
        <div className="flex items-center justify-center rounded-2xl border border-white/15 bg-brand-dark px-4 py-6">
          <span className="mr-2 font-heading text-3xl font-bold text-white/40">$</span>
          <input
            inputMode="numeric"
            value={formatCOP(value)}
            onChange={(e) => setValue(digitsOnly(e.target.value))}
            placeholder="0"
            className="w-full bg-transparent text-center font-heading text-4xl font-extrabold text-white outline-none placeholder-white/20"
          />
        </div>

        <button disabled={!value || sending} onClick={submit} className="btn-quantum mt-4 w-full py-5 text-xl shadow-neon-cyan">
          {sending ? "Enviando…" : "Enviar Respuesta del Equipo"}
        </button>
      </div>
    </div>
  );
}
