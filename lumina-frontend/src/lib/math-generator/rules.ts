import type { MathRng } from './rng';
import type { MathProblem, MathTema } from './types';

export function clampGrado(grado: number): number {
  if (!Number.isFinite(grado)) return 2;
  return Math.min(11, Math.max(1, Math.round(grado)));
}

export function defaultSinLlevar(grado: number): boolean {
  return clampGrado(grado) <= 2;
}

function maxAddend(grado: number): number {
  const g = clampGrado(grado);
  if (g === 1) return 9;
  if (g === 2) return 99;
  if (g <= 4) return 999;
  return 9999;
}

function maxFactor(grado: number): number {
  const g = clampGrado(grado);
  if (g <= 2) return 5;
  if (g === 3) return 10;
  return 12;
}

function pairKey(a: number, b: number, op: string): string {
  return `${op}:${a}:${b}`;
}

export function onesSumCarries(a: number, b: number): boolean {
  return (a % 10) + (b % 10) >= 10;
}

export function onesSubNeedsBorrow(minuendo: number, sustraendo: number): boolean {
  return minuendo % 10 < sustraendo % 10;
}

function tryMany<T>(rng: MathRng, attempts: number, fn: () => T | null): T {
  for (let i = 0; i < attempts; i++) {
    const value = fn();
    if (value !== null) return value;
  }
  const fallback = fn();
  if (fallback !== null) return fallback;
  throw new Error('math-generator: no se pudo construir un problema válido');
}

function uniquePair(
  rng: MathRng,
  seen: Set<string>,
  op: string,
  make: () => { a: number; b: number } | null,
): { a: number; b: number } {
  return tryMany(rng, 40, () => {
    const pair = make();
    if (!pair) return null;
    const key = pairKey(pair.a, pair.b, op);
    if (seen.has(key)) return null;
    seen.add(key);
    return pair;
  });
}

function buildSuma(rng: MathRng, grado: number, sinLlevar: boolean, seen: Set<string>): MathProblem {
  const max = maxAddend(grado);
  const { a, b } = uniquePair(rng, seen, '+', () => {
    let a = rng.int(1, max);
    let b = rng.int(1, max);
    if (!sinLlevar) return { a, b };
    if (grado <= 2) {
      const onesA = rng.int(0, 9);
      const onesB = rng.int(0, 9 - onesA);
      const tensMax = Math.floor(max / 10);
      const tensA = rng.int(grado === 1 ? 0 : 1, tensMax);
      const tensB = rng.int(0, tensMax);
      a = tensA * 10 + onesA;
      b = tensB * 10 + onesB;
      if (a < 1) a = onesA || 1;
      if (b < 1) b = onesB || 1;
    }
    if (onesSumCarries(a, b)) return null;
    if (a < 1 || b < 1 || a > max || b > max) return null;
    return { a, b };
  });
  return { enunciado: `¿Cuánto es ${a} + ${b}?`, respuesta: String(a + b) };
}

function buildResta(rng: MathRng, grado: number, sinLlevar: boolean, seen: Set<string>): MathProblem {
  const max = maxAddend(grado);
  const { a, b } = uniquePair(rng, seen, '-', () => {
    let minuendo = rng.int(1, max);
    let sustraendo = rng.int(1, minuendo);
    if (sinLlevar && grado <= 2) {
      const onesMin = rng.int(0, 9);
      const onesSub = rng.int(0, onesMin);
      const tensMax = Math.floor(max / 10);
      const tensMin = rng.int(grado === 1 ? 0 : 1, tensMax);
      const tensSub = rng.int(0, tensMin);
      minuendo = tensMin * 10 + onesMin;
      sustraendo = tensSub * 10 + onesSub;
      if (minuendo < 1) minuendo = onesMin || 1;
      if (sustraendo < 1 && minuendo > 0) sustraendo = onesSub;
    }
    if (sustraendo < 1 || minuendo < sustraendo) return null;
    if (sinLlevar && onesSubNeedsBorrow(minuendo, sustraendo)) return null;
    if (minuendo > max) return null;
    return { a: minuendo, b: sustraendo };
  });
  return { enunciado: `¿Cuánto es ${a} − ${b}?`, respuesta: String(a - b) };
}

function buildMultiplicacion(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const max = maxFactor(grado);
  const { a, b } = uniquePair(rng, seen, 'x', () => ({
    a: rng.int(1, max),
    b: rng.int(1, max),
  }));
  return { enunciado: `¿Cuánto es ${a} × ${b}?`, respuesta: String(a * b) };
}

function buildFracciones(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const g = clampGrado(grado);
  if (g <= 2) {
    const { a: halfOf } = uniquePair(rng, seen, '1/2', () => {
      const n = rng.int(1, 6) * 2;
      return { a: n, b: 2 };
    });
    return { enunciado: `¿Cuánto es 1/2 de ${halfOf}?`, respuesta: String(halfOf / 2) };
  }

  const den = rng.pick([2, 3, 4, 5, 6, 8]);
  const { a, b } = uniquePair(rng, seen, `frac/${den}`, () => {
    const n1 = rng.int(1, den - 1);
    const n2 = rng.int(1, den - n1);
    return { a: n1, b: n2 };
  });
  const num = a + b;
  const respuesta = num === den ? '1' : `${num}/${den}`;
  return { enunciado: `¿Cuánto es ${a}/${den} + ${b}/${den}?`, respuesta };
}

function buildEcuacion(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const max = clampGrado(grado) <= 2 ? 20 : maxAddend(grado) > 100 ? 100 : maxAddend(grado);
  const { a, b } = uniquePair(rng, seen, 'eq', () => {
    const addend = rng.int(1, Math.max(1, max - 1));
    const x = rng.int(0, max - addend);
    return { a: addend, b: x + addend };
  });
  const x = b - a;
  return { enunciado: `¿Cuál es el valor de x si x + ${a} = ${b}?`, respuesta: String(x) };
}

export function buildProblem(
  rng: MathRng,
  tema: MathTema,
  grado: number,
  sinLlevar: boolean,
  seen: Set<string>,
): MathProblem {
  switch (tema) {
    case 'suma':
      return buildSuma(rng, grado, sinLlevar, seen);
    case 'resta':
      return buildResta(rng, grado, sinLlevar, seen);
    case 'multiplicacion':
      return buildMultiplicacion(rng, grado, seen);
    case 'fracciones':
      return buildFracciones(rng, grado, seen);
    case 'ecuacion':
      return buildEcuacion(rng, grado, seen);
  }
}
