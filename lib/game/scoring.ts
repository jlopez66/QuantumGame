import "server-only";
import type { Step } from "./rounds";
import { GAME1_ANSWERS, GAME2_ANSWERS, GAME3_ANSWERS } from "./answers";

export interface TeamAnswerInput {
  team_id: string;
  answer: unknown;
}

export interface TeamScoreResult {
  team_id: string;
  points: number;
  submitted: unknown;
}

export interface ScoredRound {
  results: TeamScoreResult[];
  correctAnswer: unknown;
  adminFunFact?: string;
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

/** Un equipo acierta si el voto mayoritario de su representante coincide EXACTO con la respuesta correcta. */
function scoreExactMatch(
  responses: TeamAnswerInput[],
  teamIds: string[],
  correctAnswer: string,
  points: number
): TeamScoreResult[] {
  const byTeam = groupByTeam(responses);

  return teamIds.map((team_id) => {
    const raw = (byTeam.get(team_id) ?? []) as Array<{ choice?: string; code?: string } | string>;
    const choices = raw.map((a) => (typeof a === "string" ? a : (a?.choice ?? a?.code))).filter(Boolean) as string[];
    const teamAnswer = mode(choices);
    return { team_id, points: teamAnswer === correctAnswer ? points : 0, submitted: teamAnswer };
  });
}

/** Promedio de las cifras del equipo; gana SOLO el equipo más cercano SIN PASARSE. */
function scoreClosestWithoutGoingOver(
  responses: TeamAnswerInput[],
  teamIds: string[],
  correctAnswer: number,
  points: number
): TeamScoreResult[] {
  const byTeam = groupByTeam(responses);

  const averages = teamIds.map((team_id) => {
    const raw = (byTeam.get(team_id) ?? []) as Array<{ value?: number; price?: number } | number>;
    const nums = raw
      .map((a) => (typeof a === "number" ? a : Number(a?.value ?? a?.price)))
      .filter((n) => Number.isFinite(n));
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    return { team_id, avg };
  });

  const underOrEqual = averages.filter((t) => t.avg !== null && t.avg <= correctAnswer);
  const pool = underOrEqual.length > 0 ? underOrEqual : averages.filter((t) => t.avg !== null);

  let winnerId: string | null = null;
  if (pool.length > 0) {
    winnerId = pool.reduce((best, t) =>
      Math.abs((t.avg as number) - correctAnswer) < Math.abs((best.avg as number) - correctAnswer) ? t : best
    ).team_id;
  }

  return averages.map((t) => ({
    team_id: t.team_id,
    points: t.team_id === winnerId ? points : 0,
    submitted: t.avg,
  }));
}

/**
 * Los 3 juegos comparten el mismo trío de formatos (calentamiento binario,
 * más/menos u opción múltiple, y — solo Juego 1 — cifra exacta). Cada uno
 * lee su propia tabla de respuestas de lib/game/answers.ts según `step.game`.
 */
function scoreTrivia(
  step: Extract<Step, { kind: "binary_choice" | "multiple_choice" | "numeric_input" }>,
  responses: TeamAnswerInput[],
  teamIds: string[]
): ScoredRound {
  const answers = step.game === 1 ? GAME1_ANSWERS : step.game === 2 ? GAME2_ANSWERS : GAME3_ANSWERS;
  const answer = answers[step.round];

  if (step.kind === "numeric_input") {
    const correct = Number(answer.correctAnswer);
    return {
      results: scoreClosestWithoutGoingOver(responses, teamIds, correct, step.points),
      correctAnswer: correct,
      adminFunFact: answer.adminFunFact,
    };
  }

  const correct = String(answer.correctAnswer);
  return {
    results: scoreExactMatch(responses, teamIds, correct, step.points),
    correctAnswer: correct,
    adminFunFact: answer.adminFunFact,
  };
}

/** Punto único de entrada: puntúa cualquier paso según su `kind`, sin importar a qué juego pertenezca. */
export function scoreStep(step: Step, responses: TeamAnswerInput[], teamIds: string[]): ScoredRound {
  return scoreTrivia(step, responses, teamIds);
}
