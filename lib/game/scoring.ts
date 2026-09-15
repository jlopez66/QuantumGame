import "server-only";
import type { GameNumber, RoundNumber } from "./rounds";
import { getStep } from "./rounds";
import { PRICE_ANSWERS, TRUCK_ANSWERS } from "./answers";

export interface TeamAnswerInput {
  team_id: string;
  answer: unknown;
}

export interface TeamScoreResult {
  team_id: string;
  points: number;
  submitted: unknown;
}

function mode<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T = values[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

function groupByTeam(responses: TeamAnswerInput[]): Map<string, unknown[]> {
  const map = new Map<string, unknown[]>();
  for (const r of responses) {
    const list = map.get(r.team_id) ?? [];
    list.push(r.answer);
    map.set(r.team_id, list);
  }
  return map;
}

/** Juego 1: promedio de las cifras del equipo; gana el más cercano SIN PASARSE. */
export function scoreGame1(
  responses: TeamAnswerInput[],
  teamIds: string[],
  round: RoundNumber
): { results: TeamScoreResult[]; correctAnswer: number } {
  const correct = PRICE_ANSWERS[round];
  const byTeam = groupByTeam(responses);

  const averages = teamIds.map((team_id) => {
    const raw = (byTeam.get(team_id) ?? []) as Array<{ price: number } | number>;
    const nums = raw.map((a) => (typeof a === "number" ? a : Number(a?.price))).filter((n) => Number.isFinite(n));
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    return { team_id, avg };
  });

  const underOrEqual = averages.filter((t) => t.avg !== null && t.avg <= correct);
  const pool = underOrEqual.length > 0 ? underOrEqual : averages.filter((t) => t.avg !== null);

  let winnerId: string | null = null;
  if (pool.length > 0) {
    winnerId = pool.reduce((best, t) =>
      Math.abs((t.avg as number) - correct) < Math.abs((best.avg as number) - correct) ? t : best
    ).team_id;
  }

  const results: TeamScoreResult[] = averages.map((t) => ({
    team_id: t.team_id,
    points: t.team_id === winnerId ? 100 : 0,
    submitted: t.avg,
  }));

  return { results, correctAnswer: correct };
}

/** Juego 2: el equipo acierta si el voto mayoritario coincide con el camión correcto. */
export function scoreGame2(
  responses: TeamAnswerInput[],
  teamIds: string[],
  round: RoundNumber
): { results: TeamScoreResult[]; correctAnswer: string } {
  const correct = TRUCK_ANSWERS[round];
  const byTeam = groupByTeam(responses);

  const results: TeamScoreResult[] = teamIds.map((team_id) => {
    const raw = (byTeam.get(team_id) ?? []) as Array<{ code: string } | string>;
    const codes = raw.map((a) => (typeof a === "string" ? a : a?.code)).filter(Boolean) as string[];
    const teamAnswer = mode(codes);
    return { team_id, points: teamAnswer === correct ? 100 : 0, submitted: teamAnswer };
  });

  return { results, correctAnswer: correct };
}

/** Juego 3: 25 pts por cada uno de los 4 ítems del brief que el equipo recuerde bien. */
export function scoreGame3(
  responses: TeamAnswerInput[],
  teamIds: string[],
  game: GameNumber,
  round: RoundNumber
): { results: TeamScoreResult[]; correctAnswer: string[] } {
  const step = getStep(game, round);
  const correctItems = step && step.kind === "brief" ? step.items : [];
  const byTeam = groupByTeam(responses);

  const results: TeamScoreResult[] = teamIds.map((team_id) => {
    const raw = (byTeam.get(team_id) ?? []) as string[][];
    const teamGuess = correctItems.map((_, slotIdx) => {
      const votes = raw.map((r) => r[slotIdx]).filter(Boolean);
      return mode(votes);
    });
    const correctCount = teamGuess.filter((guess, i) => guess === correctItems[i]).length;
    return { team_id, points: correctCount * 25, submitted: teamGuess };
  });

  return { results, correctAnswer: correctItems };
}
