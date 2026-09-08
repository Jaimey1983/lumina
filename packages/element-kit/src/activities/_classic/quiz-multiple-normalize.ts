import type { QuizMultiple, QuizPregunta } from '@lumina/types/slide';

// Extraído de lumina-frontend/src/lib/class-slide-normalize.ts (E7.6.4b): lo consumen
// quiz-multiple-editor.tsx + quiz-utils.ts (co-locados en el kit) y, vía re-import,
// class-slide-normalize.ts del frontend.

const LEGACY_QUIZ_PREGUNTA_ID = 'q-legacy-0';

function asQuizRecord(act: unknown): Record<string, unknown> {
  if (!act || typeof act !== 'object' || Array.isArray(act)) return {};
  return act as Record<string, unknown>;
}

/** Migra `quiz_multiple` de pregunta única (legacy) a contenedor `preguntas[]`. Idempotente. */
export function normalizarQuizMultiple(act: unknown): QuizMultiple {
  const raw = asQuizRecord(act);
  if (Array.isArray(raw.preguntas)) {
    return {
      ...(raw as unknown as QuizMultiple),
      tipo: 'quiz_multiple',
      preguntas: raw.preguntas as QuizPregunta[],
      deliveryMode: raw.deliveryMode === 'SYNCED' ? 'SYNCED' : 'AUTONOMOUS',
      layoutVariant:
        typeof raw.layoutVariant === 'string'
          ? (raw.layoutVariant as QuizMultiple['layoutVariant'])
          : 'classic-list',
    };
  }
  const pregunta: QuizPregunta = {
    id: LEGACY_QUIZ_PREGUNTA_ID,
    texto: typeof raw.pregunta === 'string' ? raw.pregunta : '',
    opciones: Array.isArray(raw.opciones) ? (raw.opciones as QuizPregunta['opciones']) : [],
    ...(typeof raw.multipleRespuesta === 'boolean'
      ? { multipleRespuesta: raw.multipleRespuesta }
      : {}),
    ...(typeof raw.puntos === 'number' ? { puntos: raw.puntos } : {}),
    ...(raw.retroalimentacion && typeof raw.retroalimentacion === 'object'
      ? { retroalimentacion: raw.retroalimentacion as QuizPregunta['retroalimentacion'] }
      : {}),
  };
  return {
    tipo: 'quiz_multiple',
    preguntas: [pregunta],
    deliveryMode: 'AUTONOMOUS',
    layoutVariant: 'classic-list',
    ...(typeof raw.shuffleOptions === 'boolean' ? { shuffleOptions: raw.shuffleOptions } : {}),
  };
}
