import "server-only";
import type { GameNumber, RoundNumber } from "./rounds";

/**
 * Respuestas correctas de los juegos 1 y 2 (el precio real / el camión correcto).
 * SOLO se importa desde Route Handlers (app/api/**). Si algún día se importa
 * por error desde un componente 'use client', el paquete `server-only` rompe
 * el build en vez de filtrar el dato al bundle del celular.
 */
export const PRICE_ANSWERS: Record<RoundNumber, number> = {
  1: 3_450_000,
  2: 5_200_000,
  3: 6_800_000,
};

export const TRUCK_ANSWERS: Record<RoundNumber, "A" | "B" | "C" | "D"> = {
  1: "B",
  2: "D",
  3: "C",
};

export function getCorrectAnswer(game: GameNumber, round: RoundNumber): number | string | null {
  if (game === 1) return PRICE_ANSWERS[round];
  if (game === 2) return TRUCK_ANSWERS[round];
  return null; // el juego 3 se autoevalúa contra STEPS.items (públicos, ya revelados en pantalla)
}
