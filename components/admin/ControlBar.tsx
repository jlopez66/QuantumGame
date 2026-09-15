"use client";

import { useState } from "react";
import type { GameStateRow } from "@/lib/supabase/types";
import { callAdminAction, type AdminAction } from "@/lib/game/adminActions";
import { getStepIndex, STEPS, TOTAL_STEPS } from "@/lib/game/rounds";

export function ControlBar({ gameState }: { gameState: GameStateRow }) {
  const [busy, setBusy] = useState(false);

  const run = async (action: AdminAction) => {
    setBusy(true);
    try {
      await callAdminAction(action);
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = getStepIndex(gameState.current_game, gameState.current_round);
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const stepLabel = stepIndex >= 0 ? `Paso ${stepIndex + 1} / ${TOTAL_STEPS}` : "";
  const nextStep = stepIndex >= 0 && stepIndex + 1 < STEPS.length ? STEPS[stepIndex + 1] : null;

  return (
    <div className="flex items-center justify-between border-t border-white/10 bg-brand-dark/60 px-8 py-4">
      <div className="font-body text-xs uppercase tracking-widest text-white/40">
        Fase: <span className="text-white/70">{gameState.phase}</span>
        {stepLabel && <span className="ml-4">{stepLabel}</span>}
      </div>

      <div className="flex items-center gap-3">
        {gameState.phase === "lobby" && (
          <button disabled={busy} onClick={() => run("start")} className="btn-quantum px-8 py-3">
            ▶ Iniciar Juego 1 · Ronda 1
          </button>
        )}

        {gameState.phase === "roulette" && (
          <button disabled={busy} onClick={() => run("lock")} className="btn-quantum px-8 py-3">
            ⏭ Iniciar Tiempo de Respuesta Ahora
          </button>
        )}

        {gameState.phase === "intro" && (
          <button disabled={busy} onClick={() => run("lock")} className="btn-quantum px-8 py-3">
            ⏭ Saltar a Pantalla en Negro
          </button>
        )}

        {gameState.phase === "playing" && (
          <button disabled={busy} onClick={() => run("lock")} className="btn-quantum px-8 py-3">
            ⏹ Terminar Ronda Ahora
          </button>
        )}

        {gameState.phase === "locked" && (
          <button disabled={busy} onClick={() => run("reveal")} className="btn-quantum px-8 py-3 shadow-neon-green">
            🏆 Revelar Ganador
          </button>
        )}

        {gameState.phase === "revealed" && (
          <button disabled={busy} onClick={() => run("next")} className="btn-quantum px-8 py-3">
            {isLastStep || !nextStep ? "🎉 Ver Podio Final" : "⏭ Siguiente Ronda"}
          </button>
        )}

        {gameState.phase === "podium" && (
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "¿Reiniciar el evento? Se borran respuestas y puntajes; todos los jugadores quedan liberados para reclamar su nombre de nuevo."
                )
              )
                run("reset");
            }}
            className="btn-quantum px-8 py-3"
          >
            ↺ Nuevo Evento
          </button>
        )}

        {gameState.phase !== "lobby" && gameState.phase !== "podium" && (
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "¿Reiniciar el evento? Se borran respuestas y puntajes; todos los jugadores quedan liberados para reclamar su nombre de nuevo."
                )
              )
                run("reset");
            }}
            className="rounded-2xl border border-white/15 px-5 py-3 font-body text-xs uppercase tracking-wide text-white/40 transition hover:border-red-400/50 hover:text-red-400"
          >
            Reiniciar evento
          </button>
        )}
      </div>
    </div>
  );
}
