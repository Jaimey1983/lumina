import type { QuizOption } from '@lumina/types/slide';

import type { MathRng } from './rng';
import type {
  GeneratedMathActivity,
  GeneratedMathQuiz,
  GeneratedMathRespuesta,
  GeneratedMathShortAnswer,
  MathFormato,
  MathGeneratorMeta,
  MathProblem,
} from './types';

const OPTION_IDS = ['a', 'b', 'c', 'd'] as const;

function parseNumeric(value: string): number | null {
  if (/^-?\d+$/.test(value)) return Number(value);
  return null;
}

function distractorsFor(correct: string, rng: MathRng): string[] {
  const n = parseNumeric(correct);
  const raw: string[] = [];
  if (n !== null) {
    raw.push(String(n + 1), String(n - 1), String(n + 10), String(Math.abs(n - 10)), String(n * 2));
    if (n > 1) raw.push(String(n + 2));
  } else if (correct.includes('/')) {
    const [numS, denS] = correct.split('/');
    const num = Number(numS);
    const den = Number(denS);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
      raw.push(`${num + 1}/${den}`, `${Math.max(1, num - 1)}/${den}`, `${num}/${den + 1}`, '1');
    }
  }
  const unique = [...new Set(raw)].filter((x) => x !== correct && x !== '-0');
  return rng.shuffle(unique).slice(0, 3);
}

function padDistractors(correct: string, chosen: string[], rng: MathRng): string[] {
  const out = [...chosen];
  let bump = 3;
  while (out.length < 3) {
    const n = parseNumeric(correct);
    const extra = n !== null ? String(n + bump) : `${correct}-${bump}`;
    if (extra !== correct && !out.includes(extra)) out.push(extra);
    bump += 1;
    if (bump > 30) break;
  }
  return rng.shuffle(out).slice(0, 3);
}

export function toQuiz(
  problem: MathProblem,
  meta: MathGeneratorMeta,
  rng: MathRng,
): GeneratedMathQuiz {
  const wrong = padDistractors(problem.respuesta, distractorsFor(problem.respuesta, rng), rng);
  const opciones: QuizOption[] = rng.shuffle([
    { id: OPTION_IDS[0], texto: problem.respuesta, esCorrecta: true },
    ...wrong.map((texto, i) => ({
      id: OPTION_IDS[i + 1],
      texto,
      esCorrecta: false,
    })),
  ]);
  return {
    tipo: 'quiz_multiple',
    preguntas: [
      {
        id: 'q-1',
        texto: problem.enunciado,
        opciones,
        puntos: 10,
      },
    ],
    deliveryMode: 'AUTONOMOUS',
    layoutVariant: 'classic-list',
    ...meta,
  };
}

export function toShortAnswer(
  problem: MathProblem,
  meta: MathGeneratorMeta,
): GeneratedMathShortAnswer {
  return {
    tipo: 'short_answer',
    question: problem.enunciado,
    expectedAnswer: problem.respuesta,
    caseSensitive: false,
    maxLength: 24,
    ...meta,
  };
}

/** Respuesta numérica autocalificable (M3a): la respuesta del generador es siempre un número o una fracción. */
export function toRespuestaMatematica(
  problem: MathProblem,
  meta: MathGeneratorMeta,
): GeneratedMathRespuesta {
  return {
    tipo: 'respuesta_matematica',
    modo: 'numerico',
    question: problem.enunciado,
    respuesta: problem.respuesta,
    ...meta,
  };
}

export function formatProblem(
  problem: MathProblem,
  formato: MathFormato,
  meta: MathGeneratorMeta,
  rng: MathRng,
): GeneratedMathActivity {
  if (formato === 'short_answer') return toShortAnswer(problem, meta);
  if (formato === 'respuesta_matematica') return toRespuestaMatematica(problem, meta);
  return toQuiz(problem, meta, rng);
}

/**
 * Un slide de Lumina admite una sola actividad. El generador emite N ítems;
 * el quiz se fusiona en un `quiz_multiple` con N preguntas. Respuesta corta
 * no tiene lista de ítems en el schema: se toma el primero.
 */
export function toSingleEditorActivity(
  items: GeneratedMathActivity[],
): GeneratedMathActivity {
  const first = items[0];
  if (!first) {
    throw new Error('math-generator: no hay ítems para insertar');
  }
  if (first.tipo === 'short_answer' || first.tipo === 'respuesta_matematica') return first;

  const preguntas = items.flatMap((item, i) =>
    item.tipo === 'quiz_multiple'
      ? item.preguntas.map((p, j) => ({ ...p, id: `q-${i + 1}-${j + 1}` }))
      : [],
  );
  return { ...first, preguntas };
}

export function quizCorrectOptionId(activity: GeneratedMathQuiz): string {
  const hit = activity.preguntas[0]?.opciones.find((o) => o.esCorrecta);
  if (!hit) throw new Error('quiz sin opción correcta');
  return hit.id;
}
