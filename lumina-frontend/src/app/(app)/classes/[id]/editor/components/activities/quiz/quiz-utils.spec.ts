import { describe, expect, it } from 'vitest';

import type { QuizPregunta, QuizMultiple } from '@/types/slide.types';

import {
  isMultiSelectPregunta,
  isPreguntaSelectionCorrect,
  orderQuizOpciones,
  orderQuizPreguntas,
  quizFeedbackMessage,
  seededShuffle,
  updatePreguntaInActivity,
} from './quiz-utils';

const pregunta: QuizPregunta = {
  id: 'q1',
  texto: '¿2+2?',
  opciones: [
    { id: 'a', texto: '3', esCorrecta: false },
    { id: 'b', texto: '4', esCorrecta: true },
    { id: 'c', texto: '5', esCorrecta: false },
  ],
};

describe('quiz-utils', () => {
  it('seededShuffle es determinista por seed', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(seededShuffle(items, 's1')).toEqual(seededShuffle(items, 's1'));
    expect(seededShuffle(items, 's1')).not.toEqual(seededShuffle(items, 's2'));
  });

  it('isPreguntaSelectionCorrect compara conjuntos', () => {
    expect(isPreguntaSelectionCorrect(pregunta, ['b'])).toBe(true);
    expect(isPreguntaSelectionCorrect(pregunta, ['a'])).toBe(false);
  });

  it('isMultiSelectPregunta detecta flag o varias correctas', () => {
    expect(isMultiSelectPregunta(pregunta)).toBe(false);
    expect(
      isMultiSelectPregunta({
        ...pregunta,
        multipleRespuesta: true,
      }),
    ).toBe(true);
  });

  it('orderQuizPreguntas respeta shufflePreguntas', () => {
    const activity = {
      tipo: 'quiz_multiple' as const,
      preguntas: [
        { id: 'q1', texto: '1', opciones: [] },
        { id: 'q2', texto: '2', opciones: [] },
        { id: 'q3', texto: '3', opciones: [] },
      ],
      deliveryMode: 'AUTONOMOUS' as const,
      layoutVariant: 'classic-list' as const,
      shufflePreguntas: true,
    };
    const a = orderQuizPreguntas(activity, 'sess');
    const b = orderQuizPreguntas(activity, 'sess');
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    expect(a.map((p) => p.id)).not.toEqual(['q1', 'q2', 'q3']);
  });

  it('orderQuizOpciones no mezcla si shuffleOptions es false', () => {
    const ordered = orderQuizOpciones(pregunta, false, 'k');
    expect(ordered.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });

  it('quizFeedbackMessage usa textos personalizados o defaults', () => {
    expect(quizFeedbackMessage(pregunta, true)).toBe('¡Correcto!');
    expect(
      quizFeedbackMessage(
        {
          ...pregunta,
          retroalimentacion: { correcto: 'Bien hecho', incorrecto: 'Intenta otra vez' },
        },
        false,
      ),
    ).toBe('Intenta otra vez');
  });

  it('updatePreguntaInActivity parchea solo la pregunta indicada', () => {
    const activity: QuizMultiple = {
      tipo: 'quiz_multiple',
      preguntas: [
        { id: 'q1', texto: 'A', opciones: [] },
        { id: 'q2', texto: 'B', opciones: [] },
      ],
      deliveryMode: 'AUTONOMOUS',
      layoutVariant: 'classic-list',
    };
    const next = updatePreguntaInActivity(activity, 'q2', { texto: 'B2' });
    expect(next.preguntas[0].texto).toBe('A');
    expect(next.preguntas[1].texto).toBe('B2');
  });
});
