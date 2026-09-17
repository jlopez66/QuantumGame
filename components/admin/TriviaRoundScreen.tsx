"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Countdown } from "@/components/shared/Countdown";
import { callAdminAction } from "@/lib/game/adminActions";
import { getStep } from "@/lib/game/rounds";
import { TeamAnswerBadges } from "./TeamAnswerBadges";
import type { GameStateRow, TeamRow } from "@/lib/supabase/types";

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const VIDEO_EXTENSION = /\.(mp4|webm|mov)$/i;
const isVideoFile = (path: string) => VIDEO_EXTENSION.test(path);

interface Props {
  gameState: GameStateRow;
  teams: TeamRow[];
  answeredTeamIds: Set<string>;
}

/**
 * Renderiza cualquier ronda "de trivia" (binary_choice, multiple_choice o
 * numeric_input) sin importar a qué juego pertenezca — hoy la usan los 3
 * minijuegos: "Cifra Exacta" (fotos de producto), "KeepMe y Servicios" (puro
 * texto) y "Ojo de Águila" (video/GIF/foto proyectado antes de la pregunta, ver
 * `step.media` + fase `intro` más abajo).
 */
export function TriviaRoundScreen({ gameState, teams, answeredTeamIds }: Props) {
  const step = getStep(gameState.current_game, gameState.current_round);
  const videoRef = useRef<HTMLVideoElement>(null);

  // El video del "Ojo de Águila" no arranca solo al entrar a la fase intro:
  // se queda pausado en el primer frame hasta que el host presiona "Iniciar
  // Conteo" (round_ends_at deja de ser null) — mismo criterio que ya usa el
  // Countdown para no arrancar el tiempo antes de tiempo.
  useEffect(() => {
    if (gameState.phase === "intro" && gameState.round_ends_at != null) {
      videoRef.current?.play().catch(() => {});
    }
  }, [gameState.phase, gameState.round_ends_at]);

  if (!step || (step.kind !== "binary_choice" && step.kind !== "multiple_choice" && step.kind !== "numeric_input")) {
    return null;
  }

  const reveal = gameState.payload && "reveal" in gameState.payload ? gameState.payload.reveal : undefined;
  const isWarmup = step.points === 0;

  const formatAnswer = (value: unknown) => {
    if (step.kind === "numeric_input") {
      return typeof value === "number" ? COP.format(Math.round(value)) : "Sin respuesta";
    }
    return typeof value === "string" ? value : "Sin respuesta";
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.4em] text-brand-cyan">
          Juego {step.game} {isWarmup ? "· Calentamiento (sin puntos)" : `· Vale ${step.points} pts`}
        </p>
        <h2 className="font-heading text-2xl font-extrabold uppercase text-white/80">{step.title}</h2>
      </div>

      {gameState.phase === "intro" ? (
        // Fase exclusiva del Juego 3 ("Ojo de Águila"): se proyecta el video
        // y el celular todavía no muestra ni la pregunta ni las opciones.
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          {step.media &&
            (isVideoFile(step.media) ? (
              <video
                key={step.media}
                ref={videoRef}
                src={step.media}
                muted
                loop
                playsInline
                className="max-h-[55vh] rounded-2xl object-contain shadow-neon-cyan"
              />
            ) : (
              // GIF/foto: next/image optimiza y congela el primer frame de un
              // GIF, por eso se usa <img> plano para garantizar la animación.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={step.media} alt="" className="max-h-[55vh] rounded-2xl object-contain shadow-neon-cyan" />
            ))}
          <Countdown
            endsAt={gameState.round_ends_at}
            totalSeconds={step.introDuration ?? 10}
            size="sm"
            onComplete={() => callAdminAction("lock")}
          />
          <p className="font-heading text-xl font-bold uppercase text-white/70">¡Ojo de águila! Atentos a la pantalla…</p>
        </div>
      ) : (
        <>
          {/* Pregunta grande y fija — siempre visible arriba del contador, sin
              importar el tamaño de pantalla ni si hay foto o no. */}
          <div className="card-quantum glow-border mx-auto w-full max-w-5xl px-8 py-6 text-center">
            <p className="font-heading text-3xl font-extrabold leading-snug text-white sm:text-4xl">{step.question}</p>
          </div>

          <div className={`grid flex-1 gap-8 ${step.images.length > 0 ? "grid-cols-[1.2fr_1fr]" : "grid-cols-1"}`}>
            {step.images.length > 0 && (
              // Mismo contenedor (fondo blanco, sin borde, imagen completa sin
              // recortar) sin importar si hay 1 o varias fotos — así se ven
              // parejas incluso si el archivo original trae fondo transparente.
              <div className="grid h-full gap-3" style={{ gridTemplateColumns: `repeat(${step.images.length}, 1fr)` }}>
                {step.images.map((src, i) => (
                  <div key={src} className="relative h-full w-full overflow-hidden rounded-2xl bg-white p-6">
                    <div className="relative h-full w-full">
                      <Image src={src} alt={`${step.title} — producto ${i + 1}`} fill className="object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col items-center justify-center gap-6">
              {gameState.phase === "playing" && (
                <>
                  <Countdown endsAt={gameState.round_ends_at} totalSeconds={step.duration} onComplete={() => callAdminAction("lock")} />

                  {step.kind !== "numeric_input" && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {step.options.map((opt) => (
                        <span key={opt} className="card-quantum px-4 py-2 font-heading text-sm font-bold text-white/70">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  <TeamAnswerBadges teams={teams} answeredTeamIds={answeredTeamIds} />
                </>
              )}

              {gameState.phase === "locked" && (
                <p className="font-heading text-2xl font-bold uppercase text-brand-purple animate-pulse-glow">⏳ Calculando…</p>
              )}

              {gameState.phase === "revealed" && reveal && (
                <div className="text-center">
                  <p className="font-body uppercase tracking-widest text-white/50">Respuesta correcta</p>
                  <p className="text-quantum-gradient font-heading text-5xl font-extrabold">{formatAnswer(reveal.correctAnswer)}</p>
                </div>
              )}
            </div>
          </div>

          {gameState.phase === "revealed" && reveal?.adminFunFact && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="card-quantum glow-border mx-auto max-w-3xl px-8 py-5 text-center shadow-neon-green"
            >
              <p className="font-heading text-2xl font-extrabold uppercase leading-snug text-brand-green">💡 {reveal.adminFunFact}</p>
            </motion.div>
          )}

          {gameState.phase === "revealed" && reveal && (
            <div className="grid grid-cols-5 gap-4">
              {reveal.results
                .slice()
                .sort((a, b) => b.points - a.points)
                .map((r) => (
                  <motion.div
                    key={r.team_id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="card-quantum flex flex-col items-center gap-1 border-t-4 p-4"
                    style={{ borderTopColor: r.color }}
                  >
                    <span className="text-center font-body text-xs text-white/60">{r.team_name}</span>
                    {r.representative_name && <span className="font-body text-[0.65rem] text-white/40">{r.representative_name}</span>}
                    <span className="font-heading text-lg font-extrabold text-white">{formatAnswer(r.submitted)}</span>
                    {r.points > 0 && <span className="font-heading text-sm font-bold text-brand-green">+{r.points} pts</span>}
                  </motion.div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
