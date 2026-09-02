import type { QuizLayoutVariant, QuizMultiple, QuizOption, QuizPregunta } from '@/types/slide.types';

import { normalizarQuizMultiple } from '@/lib/class-slide-normalize';

export type QuizAnswersMap = Record<string, string[]>;

export function emptyPregunta(): QuizPregunta {
  return { id: 'q-legacy-0', texto: '', opciones: [] };
}

export function firstPregunta(activity: QuizMultiple): QuizPregunta {
  return activity.preguntas[0] ?? emptyPregunta();
}

export function getCorrectIds(pregunta: QuizPregunta): string[] {
  return pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id);
}

export function isMultiSelectPregunta(pregunta: QuizPregunta): boolean {
  const correctIds = getCorrectIds(pregunta);
  return pregunta.multipleRespuesta === true || correctIds.length > 1;
}

export function isPreguntaSelectionCorrect(
  pregunta: QuizPregunta,
  selectedIds: string[],
): boolean {
  const correctIds = getCorrectIds(pregunta);
  if (correctIds.length === 0) return false;
  if (selectedIds.length !== correctIds.length) return false;
  const set = new Set(selectedIds);
  return correctIds.every((id) => set.has(id));
}

export function buildQuizAnswersPayload(answers: QuizAnswersMap): { answers: QuizAnswersMap } {
  return { answers };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher-Yates determinista — estable por sesión (`seed`). */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const arr = [...items];
  let state = hashString(seed);
  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function prepareQuizActivity(activity: QuizMultiple): QuizMultiple {
  return normalizarQuizMultiple(activity);
}

export function orderQuizPreguntas(
  activity: QuizMultiple,
  sessionKey: string,
): QuizPregunta[] {
  const base = activity.preguntas.length > 0 ? [...activity.preguntas] : [emptyPregunta()];
  if (!activity.shufflePreguntas) return base;
  return seededShuffle(base, `${sessionKey}:preguntas`);
}

export function orderQuizOpciones(
  pregunta: QuizPregunta,
  shuffle: boolean | undefined,
  sessionKey: string,
): QuizOption[] {
  const base = [...pregunta.opciones];
  if (!shuffle) return base;
  return seededShuffle(base, `${sessionKey}:opciones:${pregunta.id}`);
}

export const QUIZ_MAX_PREGUNTAS = 20;
export const QUIZ_MAX_OPCIONES = 6;

export const QUIZ_LAYOUT_LABELS: Record<QuizLayoutVariant, string> = {
  'classic-list': 'Lista clásica',
  'color-grid': 'Grid de colores',
  'icon-cards': 'Tarjetas con icono',
  'pills-horizontal': 'Pills horizontales',
  'two-col-color-list': 'Dos columnas · lista color',
  'two-col-neutral-grid': 'Dos columnas · grid neutro',
  'two-col-image-pills': 'Dos columnas · imagen + pills',
};

export const ALL_QUIZ_LAYOUT_VARIANTS: QuizLayoutVariant[] = [
  'classic-list',
  'color-grid',
  'icon-cards',
  'pills-horizontal',
  'two-col-color-list',
  'two-col-neutral-grid',
  'two-col-image-pills',
];

export function isTwoColumnQuizLayout(variant: QuizLayoutVariant): boolean {
  return variant.startsWith('two-col-');
}

export function quizLayoutUsesQuestionImage(variant: QuizLayoutVariant): boolean {
  return variant === 'two-col-image-pills';
}

export function quizFeedbackMessage(pregunta: QuizPregunta, correct: boolean): string {
  const fb = pregunta.retroalimentacion;
  if (correct) return fb?.correcto ?? '¡Correcto!';
  return fb?.incorrecto ?? 'Incorrecto. La respuesta correcta está resaltada.';
}

export function updatePreguntaInActivity(
  activity: QuizMultiple,
  preguntaId: string,
  patch: Partial<QuizPregunta>,
): QuizMultiple {
  return {
    ...activity,
    tipo: 'quiz_multiple',
    preguntas: activity.preguntas.map((p) => (p.id === preguntaId ? { ...p, ...patch } : p)),
  };
}
