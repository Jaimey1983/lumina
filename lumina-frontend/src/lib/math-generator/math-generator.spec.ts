import { describe, expect, it } from 'vitest';

import { evaluateActivityResponse } from '@/lib/activity-scoring';

import {
  generateMathActivities,
  onesSumCarries,
  quizCorrectOptionId,
  type GeneratedMathQuiz,
  type GeneratedMathShortAnswer,
} from './index';

function parseSuma(pregunta: string): { a: number; b: number } {
  const m = pregunta.match(/¿Cuánto es (\d+) \+ (\d+)\?/);
  if (!m) throw new Error(`enunciado de suma inesperado: ${pregunta}`);
  return { a: Number(m[1]), b: Number(m[2]) };
}

function parseResta(pregunta: string): { a: number; b: number } {
  const m = pregunta.match(/¿Cuánto es (\d+) − (\d+)\?/);
  if (!m) throw new Error(`enunciado de resta inesperado: ${pregunta}`);
  return { a: Number(m[1]), b: Number(m[2]) };
}

function asQuiz(item: { tipo: string }): GeneratedMathQuiz {
  expect(item.tipo).toBe('quiz_multiple');
  return item as GeneratedMathQuiz;
}

describe('generateMathActivities — suma grado 2 sin llevar', () => {
  const items = generateMathActivities({
    tema: 'suma',
    grado: 2,
    cantidad: 10,
    seed: 20260830,
  });

  it('emite 10 quizzes quiz_multiple con metadatos del generador', () => {
    expect(items).toHaveLength(10);
    for (const item of items) {
      const quiz = asQuiz(item);
      expect(quiz.generador).toBe('matematicas');
      expect(quiz.tema).toBe('suma');
      expect(quiz.grado).toBe(2);
      expect(quiz.pregunta).toMatch(/^¿Cuánto es \d+ \+ \d+\?$/);
      expect(quiz.opciones).toHaveLength(4);
      expect(quiz.opciones.filter((o) => o.esCorrecta)).toHaveLength(1);
    }
  });

  it('ninguna suma reagrupa las unidades (sin llevar)', () => {
    for (const item of items) {
      const { a, b } = parseSuma(asQuiz(item).pregunta);
      expect(onesSumCarries(a, b)).toBe(false);
    }
  });

  it('evaluateActivityResponse marca bien la opción correcta e incorrecta', () => {
    for (const item of items) {
      const quiz = asQuiz(item);
      const { a, b } = parseSuma(quiz.pregunta);
      const correctId = quizCorrectOptionId(quiz);
      const correctOpt = quiz.opciones.find((o) => o.id === correctId);
      expect(correctOpt?.texto).toBe(String(a + b));

      const ok = evaluateActivityResponse('quiz_multiple', quiz, correctId);
      expect(ok.correct).toBe(true);
      expect(ok.score).toBe(5.0);

      const wrongId = quiz.opciones.find((o) => !o.esCorrecta)?.id;
      const bad = evaluateActivityResponse('quiz_multiple', quiz, wrongId);
      expect(bad.correct).toBe(false);
      expect(bad.score).toBe(1.0);
    }
  });
});

describe('generateMathActivities — determinismo y formatos', () => {
  it('misma semilla produce los mismos ítems', () => {
    const opts = { tema: 'suma' as const, grado: 2, cantidad: 10, seed: 42 };
    expect(generateMathActivities(opts)).toEqual(generateMathActivities(opts));
  });

  it('otra semilla cambia el lote', () => {
    const a = generateMathActivities({ tema: 'suma', grado: 2, cantidad: 10, seed: 1 });
    const b = generateMathActivities({ tema: 'suma', grado: 2, cantidad: 10, seed: 2 });
    expect(a).not.toEqual(b);
  });

  it('short_answer guarda la respuesta esperada; scoring sigue manual', () => {
    const items = generateMathActivities({
      tema: 'suma',
      grado: 2,
      cantidad: 5,
      seed: 7,
      formato: 'short_answer',
    });
    expect(items).toHaveLength(5);
    for (const item of items) {
      expect(item.tipo).toBe('short_answer');
      const sa = item as GeneratedMathShortAnswer;
      const { a, b } = parseSuma(sa.question);
      expect(sa.expectedAnswer).toBe(String(a + b));
      const evaluated = evaluateActivityResponse('short_answer', sa, sa.expectedAnswer);
      expect(evaluated.score).toBeNull();
      expect(evaluated.correct).toBeNull();
    }
  });
});

describe('generateMathActivities — otros temas v1', () => {
  it('resta grado 2: minuendo ≥ sustraendo y evaluateActivityResponse correcto', () => {
    const items = generateMathActivities({
      tema: 'resta',
      grado: 2,
      cantidad: 8,
      seed: 11,
    });
    for (const item of items) {
      const quiz = asQuiz(item);
      const { a, b } = parseResta(quiz.pregunta);
      expect(a).toBeGreaterThanOrEqual(b);
      const ok = evaluateActivityResponse('quiz_multiple', quiz, quizCorrectOptionId(quiz));
      expect(ok.score).toBe(5.0);
      expect(quiz.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(a - b));
    }
  });

  it('multiplicación simple: factores 1–5 en grado 2', () => {
    const items = generateMathActivities({
      tema: 'multiplicacion',
      grado: 2,
      cantidad: 6,
      seed: 3,
    });
    for (const item of items) {
      const quiz = asQuiz(item);
      const m = quiz.pregunta.match(/¿Cuánto es (\d+) × (\d+)\?/);
      expect(m).not.toBeNull();
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(5);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(5);
      expect(quiz.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(a * b));
      expect(evaluateActivityResponse('quiz_multiple', quiz, quizCorrectOptionId(quiz)).score).toBe(
        5.0,
      );
    }
  });

  it('fracciones básicas grado 2: mitad de un par', () => {
    const items = generateMathActivities({
      tema: 'fracciones',
      grado: 2,
      cantidad: 5,
      seed: 9,
    });
    for (const item of items) {
      const quiz = asQuiz(item);
      const m = quiz.pregunta.match(/¿Cuánto es 1\/2 de (\d+)\?/);
      expect(m).not.toBeNull();
      const n = Number(m![1]);
      expect(n % 2).toBe(0);
      expect(quiz.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(n / 2));
      expect(evaluateActivityResponse('quiz_multiple', quiz, quizCorrectOptionId(quiz)).correct).toBe(
        true,
      );
    }
  });

  it('ecuación x + a = b: x = b − a', () => {
    const items = generateMathActivities({
      tema: 'ecuacion',
      grado: 2,
      cantidad: 6,
      seed: 15,
    });
    for (const item of items) {
      const quiz = asQuiz(item);
      const m = quiz.pregunta.match(/x \+ (\d+) = (\d+)/);
      expect(m).not.toBeNull();
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(quiz.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(b - a));
      expect(evaluateActivityResponse('quiz_multiple', quiz, quizCorrectOptionId(quiz)).score).toBe(
        5.0,
      );
    }
  });

  it('fracciones grado 3: misma denominador, respuesta coherente', () => {
    const items = generateMathActivities({
      tema: 'fracciones',
      grado: 3,
      cantidad: 4,
      seed: 21,
      formato: 'short_answer',
    });
    for (const item of items) {
      const sa = item as GeneratedMathShortAnswer;
      const m = sa.question.match(/¿Cuánto es (\d+)\/(\d+) \+ (\d+)\/(\d+)\?/);
      expect(m).not.toBeNull();
      expect(m![2]).toBe(m![4]);
      const num = Number(m![1]) + Number(m![3]);
      const den = Number(m![2]);
      const expected = num === den ? '1' : `${num}/${den}`;
      expect(sa.expectedAnswer).toBe(expected);
    }
  });
});
