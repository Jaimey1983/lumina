import { describe, expect, it } from 'vitest';

import { evaluateActivityResponse, expresionesEquivalentes } from '@lumina/scoring';

import {
  generateMathActivities,
  onesSumCarries,
  quizCorrectOptionId,
  toSingleEditorActivity,
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

function quizP0(quiz: GeneratedMathQuiz) {
  const p = quiz.preguntas[0];
  if (!p) throw new Error('quiz sin preguntas');
  return p;
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
      expect(quizP0(quiz).texto).toMatch(/^¿Cuánto es \d+ \+ \d+\?$/);
      expect(quizP0(quiz).opciones).toHaveLength(4);
      expect(quizP0(quiz).opciones.filter((o) => o.esCorrecta)).toHaveLength(1);
    }
  });

  it('ninguna suma reagrupa las unidades (sin llevar)', () => {
    for (const item of items) {
      const { a, b } = parseSuma(quizP0(asQuiz(item)).texto);
      expect(onesSumCarries(a, b)).toBe(false);
    }
  });

  it('evaluateActivityResponse marca bien la opción correcta e incorrecta', () => {
    for (const item of items) {
      const quiz = asQuiz(item);
      const q0 = quizP0(quiz);
      const { a, b } = parseSuma(q0.texto);
      const correctId = quizCorrectOptionId(quiz);
      const correctOpt = q0.opciones.find((o) => o.id === correctId);
      expect(correctOpt?.texto).toBe(String(a + b));

      const ok = evaluateActivityResponse('quiz_multiple', quiz, correctId);
      expect(ok.correct).toBe(true);
      expect(ok.score).toBe(5.0);

      const wrongId = q0.opciones.find((o) => !o.esCorrecta)?.id;
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
      const q0 = quizP0(quiz);
      const { a, b } = parseResta(q0.texto);
      expect(a).toBeGreaterThanOrEqual(b);
      const ok = evaluateActivityResponse('quiz_multiple', quiz, quizCorrectOptionId(quiz));
      expect(ok.score).toBe(5.0);
      expect(q0.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(a - b));
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
      const q0 = quizP0(quiz);
      const m = q0.texto.match(/¿Cuánto es (\d+) × (\d+)\?/);
      expect(m).not.toBeNull();
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(5);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(5);
      expect(q0.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(a * b));
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
      const q0 = quizP0(quiz);
      const m = q0.texto.match(/¿Cuánto es \\\(\\frac\{1\}\{2\}\\\) de (\d+)\?/);
      expect(m).not.toBeNull();
      const n = Number(m![1]);
      expect(n % 2).toBe(0);
      expect(q0.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(n / 2));
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
      const q0 = quizP0(quiz);
      const m = q0.texto.match(/x \+ (\d+) = (\d+)/);
      expect(m).not.toBeNull();
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(q0.opciones.find((o) => o.esCorrecta)?.texto).toBe(String(b - a));
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
      const m = sa.question.match(/¿Cuánto es \\\(\\frac\{(\d+)\}\{(\d+)\}\+\\frac\{(\d+)\}\{(\d+)\}\\\)\?/);
      expect(m).not.toBeNull();
      expect(m![2]).toBe(m![4]);
      const num = Number(m![1]) + Number(m![3]);
      const den = Number(m![2]);
      const expected = num === den ? '1' : `${num}/${den}`;
      expect(sa.expectedAnswer).toBe(expected);
    }
  });
});

describe('toSingleEditorActivity', () => {
  it('fusiona N quizzes en una actividad con N preguntas e ids únicos', () => {
    const items = generateMathActivities({
      tema: 'suma',
      grado: 2,
      cantidad: 8,
      seed: 1,
    });
    const merged = toSingleEditorActivity(items);
    expect(merged.tipo).toBe('quiz_multiple');
    const quiz = merged as GeneratedMathQuiz;
    expect(quiz.preguntas).toHaveLength(8);
    const ids = quiz.preguntas.map((p) => p.id);
    expect(new Set(ids).size).toBe(8);
    for (const p of quiz.preguntas) {
      expect(p.opciones.filter((o) => o.esCorrecta)).toHaveLength(1);
    }
  });

  it('respuesta corta: un ítem (el schema no admite lista)', () => {
    const items = generateMathActivities({
      tema: 'ecuacion',
      grado: 5,
      cantidad: 5,
      seed: 9,
      formato: 'short_answer',
    });
    expect(items).toHaveLength(5);
    const inserted = toSingleEditorActivity(items);
    expect(inserted).toEqual(items[0]);
  });
});

describe('formato respuesta_matematica (M3a)', () => {
  const temas = ['suma', 'resta', 'multiplicacion', 'fracciones', 'ecuacion'] as const;

  it.each(temas)('%s: la respuesta del generador se califica correcta y un número distinto no', (tema) => {
    for (const grado of [2, 5, 9]) {
      const [item] = generateMathActivities({
        tema,
        grado,
        cantidad: 1,
        formato: 'respuesta_matematica',
        seed: 7,
      });
      expect(item?.tipo).toBe('respuesta_matematica');
      if (item?.tipo !== 'respuesta_matematica') return;
      const ok = evaluateActivityResponse('respuesta_matematica', item, item.respuesta);
      expect(ok.correct).toBe(true);
      expect(ok.score).toBe(5);
      const mal = evaluateActivityResponse('respuesta_matematica', item, '999999');
      expect(mal.correct).toBe(false);
    }
  });

  it('toSingleEditorActivity conserva la actividad tal cual', () => {
    const items = generateMathActivities({
      tema: 'suma',
      grado: 3,
      cantidad: 1,
      formato: 'respuesta_matematica',
      seed: 1,
    });
    expect(toSingleEditorActivity(items)).toBe(items[0]);
  });
});

describe('temas de grados 6–11 (M3b)', () => {
  const gen = (tema: Parameters<typeof generateMathActivities>[0]['tema'], cantidad = 12, seed = 3) =>
    generateMathActivities({ tema, grado: 8, cantidad, seed, formato: 'respuesta_matematica' }).map(
      (i) => {
        if (i.tipo !== 'respuesta_matematica') throw new Error('formato inesperado');
        return i;
      },
    );
  /** `\\(2x - 3\\)` → `2x - 3`, con `^{n}` llevado a `^(n)` para el evaluador. */
  const expr = (latex: string) => latex.replace(/\^\{(-?\d+)\}/g, '^($1)');
  const formulas = (q: string) => [...q.matchAll(/\\\((.+?)\\\)/g)].map((m) => m[1]!);

  it('potencias: la respuesta es base^exp', () => {
    for (const it of gen('potencias')) {
      const m = /\\\((\d+)\^\{(\d+)\}\\\)/.exec(it.question)!;
      expect(it.respuesta).toBe(String(Number(m[1]) ** Number(m[2])));
    }
  });

  it('porcentajes: la respuesta es entera y es el porcentaje de la base', () => {
    for (const it of gen('porcentajes')) {
      const m = /\\\((\d+)\\%\\\) de (\d+)/.exec(it.question)!;
      const v = (Number(m[1]) * Number(m[2])) / 100;
      expect(Number.isInteger(v)).toBe(true);
      expect(it.respuesta).toBe(String(v));
    }
  });

  it('ecuación lineal: la solución satisface la ecuación', () => {
    for (const it of gen('ecuacion_lineal')) {
      const [eq] = formulas(it.question);
      const [lhs, rhs] = eq!.split('=');
      const reemplazada = expr(lhs!).replace(/x/g, `(${it.respuesta})`);
      expect(expresionesEquivalentes(reemplazada, rhs!)).toBe(true);
    }
  });

  it('función lineal y polinomio: f(k) coincide con la evaluación de la expresión', () => {
    for (const tema of ['funcion_lineal', 'polinomio'] as const) {
      for (const it of gen(tema)) {
        const [def, llamada] = formulas(it.question);
        const k = /\((-?\d+)\)$/.exec(llamada!)![1]!;
        const cuerpo = expr(def!.split('=')[1]!).replace(/x/g, `(${k})`);
        expect(expresionesEquivalentes(cuerpo, it.respuesta), it.question).toBe(true);
      }
    }
  });

  it('derivada: f\'(k) = a·n·k^(n−1)', () => {
    for (const it of gen('derivada')) {
      const m = /f\(x\) = (\d*)x\^\{(\d)\}.*f'\((\d)\)/.exec(it.question)!;
      const a = m[1] === '' ? 1 : Number(m[1]);
      const n = Number(m[2]);
      const k = Number(m[3]);
      expect(it.respuesta).toBe(String(a * n * k ** (n - 1)));
    }
  });

  it('todos los temas nuevos: respuesta entera, autocalificable y determinista', () => {
    for (const tema of ['potencias', 'porcentajes', 'ecuacion_lineal', 'funcion_lineal', 'polinomio', 'derivada'] as const) {
      const a = gen(tema, 5, 11);
      const b = gen(tema, 5, 11);
      expect(a).toEqual(b);
      for (const it of a) {
        expect(/^-?\d+$/.test(it.respuesta)).toBe(true);
        expect(evaluateActivityResponse('respuesta_matematica', it, it.respuesta).score).toBe(5);
      }
    }
  });

  it('pedir más problemas que combinaciones no lanza (repite)', () => {
    expect(() =>
      generateMathActivities({ tema: 'potencias', grado: 6, cantidad: 40, seed: 2 }),
    ).not.toThrow();
  });

  it('el quiz muestra las fracciones como fracción y la correcta sigue siendo una sola', () => {
    const [q] = generateMathActivities({ tema: 'fracciones', grado: 4, cantidad: 1, seed: 5 });
    const quiz = q as GeneratedMathQuiz;
    for (const o of quiz.preguntas[0]!.opciones) {
      if (o.texto.includes('/')) throw new Error(`fracción sin formato: ${o.texto}`);
    }
    expect(quiz.preguntas[0]!.opciones.filter((o) => o.esCorrecta)).toHaveLength(1);
  });
});
