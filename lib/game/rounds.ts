/**
 * Navegación entre pasos del juego. El contenido en sí (preguntas, imágenes,
 * opciones, puntos) vive en lib/game/rounds-data.ts — edita ese archivo para
 * cambiar el guion de cualquier minijuego.
 *
 * IMPORTANTE: la Ronda 0 del Juego 1 es un valor legítimo (calentamiento sin
 * puntos), así que todas las comparaciones de acá usan `== null` en vez de
 * negación directa (`!round`) — con `!round`, `0` se trataría como "sin
 * ronda" y rompería el calentamiento.
 */
export * from "./rounds-data";
import { STEPS } from "./rounds-data";
import type { GameNumber, RoundNumber, Step } from "./rounds-data";

export const STEP_ORDER: Array<{ game: GameNumber; round: RoundNumber }> = STEPS.map((s) => ({
  game: s.game,
  round: s.round,
}));

export function getStep(game: GameNumber | null, round: RoundNumber | null): Step | null {
  if (game == null || round == null) return null;
  return STEPS.find((s) => s.game === game && s.round === round) ?? null;
}

export function getStepIndex(game: GameNumber | null, round: RoundNumber | null): number {
  if (game == null || round == null) return -1;
  return STEP_ORDER.findIndex((s) => s.game === game && s.round === round);
}

export function getNextStep(game: GameNumber | null, round: RoundNumber | null): Step | null {
  const idx = getStepIndex(game, round);
  if (idx === -1) return STEPS[0] ?? null; // desde el lobby -> primer paso
  const next = STEP_ORDER[idx + 1];
  return next ? getStep(next.game, next.round) : null; // null => fin, pasa a podio
}

export const TOTAL_STEPS = STEPS.length;
