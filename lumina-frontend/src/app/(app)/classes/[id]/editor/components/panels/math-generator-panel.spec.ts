import { describe, expect, it, vi } from 'vitest';

import { evaluateActivityResponse } from '@lumina/scoring';

import {
  generateMathActivities,
  quizCorrectOptionId,
  toSingleEditorActivity,
  type GeneratedMathQuiz,
} from '@/lib/math-generator';

/**
 * Contrato del panel: genera con el motor, fusiona y entrega el mismo
 * `Activity` que `onInsertActivity` (ActivitiesAiPanel).
 */
function payloadDelPanel(opts: {
  tema: 'suma' | 'resta' | 'multiplicacion' | 'fracciones' | 'ecuacion';
  grado: number;
  cantidad: number;
  formato?: 'quiz_multiple' | 'short_answer';
  seed: number;
  sinLlevar?: boolean;
}) {
  return toSingleEditorActivity(generateMathActivities(opts));
}

describe('MathGeneratorPanel — payload de inserción', () => {
  it('inserta un quiz_multiple con tantas preguntas como cantidad', () => {
    const content = payloadDelPanel({
      tema: 'suma',
      grado: 2,
      cantidad: 8,
      seed: 20260830,
    });
    expect(content.tipo).toBe('quiz_multiple');
    const quiz = content as GeneratedMathQuiz;
    expect(quiz.preguntas).toHaveLength(8);
    expect(quiz.generador).toBe('matematicas');
    expect(quiz.deliveryMode).toBe('AUTONOMOUS');
  });

  it('el quiz fusionado sigue siendo autoevaluable en la primera pregunta', () => {
    const quiz = payloadDelPanel({
      tema: 'multiplicacion',
      grado: 3,
      cantidad: 5,
      seed: 42,
    }) as GeneratedMathQuiz;
    const first = { ...quiz, preguntas: [quiz.preguntas[0]!] };
    const correctId = quizCorrectOptionId(first);
    const ok = evaluateActivityResponse('quiz_multiple', first, correctId);
    expect(ok.correct).toBe(true);
  });

  it('onInsertActivity recibe el objeto fusionado, no el array', () => {
    const onInsertActivity = vi.fn();
    const activity = payloadDelPanel({
      tema: 'resta',
      grado: 2,
      cantidad: 5,
      seed: 3,
    });
    onInsertActivity(activity as unknown as Record<string, unknown>);
    expect(onInsertActivity).toHaveBeenCalledTimes(1);
    const sent = onInsertActivity.mock.calls[0]![0] as { tipo: string; preguntas?: unknown[] };
    expect(sent.tipo).toBe('quiz_multiple');
    expect(Array.isArray(sent.preguntas)).toBe(true);
    expect(sent.preguntas).toHaveLength(5);
  });
});
