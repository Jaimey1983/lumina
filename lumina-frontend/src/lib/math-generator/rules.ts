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
    return { enunciado: `¿Cuánto es \\(\\frac{1}{2}\\) de ${halfOf}?`, respuesta: String(halfOf / 2) };
  }

  const den = rng.pick([2, 3, 4, 5, 6, 8]);
  const { a, b } = uniquePair(rng, seen, `frac/${den}`, () => {
    const n1 = rng.int(1, den - 1);
    const n2 = rng.int(1, den - n1);
    return { a: n1, b: n2 };
  });
  const num = a + b;
  const respuesta = num === den ? '1' : `${num}/${den}`;
  return {
    enunciado: `¿Cuánto es \\(\\frac{${a}}{${den}}+\\frac{${b}}{${den}}\\)?`,
    respuesta,
  };
}

function buildEcuacion(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const max = clampGrado(grado) <= 2 ? 20 : maxAddend(grado) > 100 ? 100 : maxAddend(grado);
  const { a, b } = uniquePair(rng, seen, 'eq', () => {
    const addend = rng.int(1, Math.max(1, max - 1));
    const x = rng.int(0, max - addend);
    return { a: addend, b: x + addend };
  });
  const x = b - a;
  return {
    enunciado: `¿Cuál es el valor de \\(x\\) si \\(x + ${a} = ${b}\\)?`,
    respuesta: String(x),
  };
}

// ─── Grados 6–11 (M3b) ──────────────────────────────────────────────────────

/**
 * Un problema que no se repite dentro de la tanda. Si el espacio de problemas es
 * más chico que la cantidad pedida, repite en vez de lanzar (la tanda es
 * decorativa para el docente, no una invariante).
 */
function uniqueProblem(
  rng: MathRng,
  seen: Set<string>,
  make: () => MathProblem,
): MathProblem {
  let last = make();
  for (let i = 0; i < 60; i++) {
    if (!seen.has(last.enunciado)) break;
    last = make();
  }
  seen.add(last.enunciado);
  void rng;
  return last;
}

/** `ax + b` sin ceros ni unos redundantes: 1x → x, +-3 → -3. */
function lineal(m: number, n: number, v = 'x'): string {
  const cuerpo = m === 1 ? v : m === -1 ? `-${v}` : `${m}${v}`;
  if (n === 0) return cuerpo;
  return `${cuerpo} ${n > 0 ? '+' : '-'} ${Math.abs(n)}`;
}

function buildPotencias(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const g = clampGrado(grado);
  return uniqueProblem(rng, seen, () => {
    const base = rng.int(2, g <= 6 ? 6 : 10);
    const exp = rng.int(2, g <= 6 ? 3 : 4);
    return {
      enunciado: `¿Cuánto es \\(${base}^{${exp}}\\)?`,
      respuesta: String(base ** exp),
    };
  });
}

function buildPorcentajes(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const g = clampGrado(grado);
  return uniqueProblem(rng, seen, () => {
    const pct = rng.pick(g <= 6 ? [10, 20, 25, 50, 75] : [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const base = rng.int(1, g <= 6 ? 10 : 25) * 20; // múltiplo de 20: el resultado es entero
    return {
      enunciado: `¿Cuánto es el \\(${pct}\\%\\) de ${base}?`,
      respuesta: String((pct * base) / 100),
    };
  });
}

function buildEcuacionLineal(rng: MathRng, grado: number, seen: Set<string>): MathProblem {
  const g = clampGrado(grado);
  return uniqueProblem(rng, seen, () => {
    const a = rng.int(2, g <= 7 ? 6 : 9);
    const x = rng.int(g <= 7 ? 1 : -6, 9);
    const b = rng.int(g <= 7 ? 1 : -9, 9);
    const c = a * x + b;
    return {
      enunciado: `Resuelve \\(${lineal(a, b)} = ${c}\\). ¿Cuál es el valor de \\(x\\)?`,
      respuesta: String(x),
    };
  });
}

function buildFuncionLineal(rng: MathRng, _grado: number, seen: Set<string>): MathProblem {
  return uniqueProblem(rng, seen, () => {
    const m = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    const n = rng.int(-9, 9);
    const k = rng.int(-4, 6);
    return {
      enunciado: `Si \\(f(x) = ${lineal(m, n)}\\), ¿cuánto vale \\(f(${k})\\)?`,
      respuesta: String(m * k + n),
    };
  });
}

function buildPolinomio(rng: MathRng, _grado: number, seen: Set<string>): MathProblem {
  return uniqueProblem(rng, seen, () => {
    const a = rng.int(1, 3);
    const b = rng.int(-6, 6);
    const c = rng.int(-6, 6);
    const k = rng.int(-3, 4);
    const termA = a === 1 ? 'x^{2}' : `${a}x^{2}`;
    const termB = b === 0 ? '' : ` ${b > 0 ? '+' : '-'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
    const termC = c === 0 ? '' : ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
    return {
      enunciado: `Si \\(p(x) = ${termA}${termB}${termC}\\), ¿cuánto vale \\(p(${k})\\)?`,
      respuesta: String(a * k * k + b * k + c),
    };
  });
}

function buildDerivada(rng: MathRng, _grado: number, seen: Set<string>): MathProblem {
  return uniqueProblem(rng, seen, () => {
    const a = rng.int(1, 5);
    const n = rng.int(2, 4);
    const k = rng.int(1, 3);
    const coef = a === 1 ? '' : String(a);
    return {
      enunciado: `Si \\(f(x) = ${coef}x^{${n}}\\), ¿cuánto vale \\(f'(${k})\\)?`,
      respuesta: String(a * n * k ** (n - 1)),
    };
  });
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
    case 'potencias':
      return buildPotencias(rng, grado, seen);
    case 'porcentajes':
      return buildPorcentajes(rng, grado, seen);
    case 'ecuacion_lineal':
      return buildEcuacionLineal(rng, grado, seen);
    case 'funcion_lineal':
      return buildFuncionLineal(rng, grado, seen);
    case 'polinomio':
      return buildPolinomio(rng, grado, seen);
    case 'derivada':
      return buildDerivada(rng, grado, seen);
  }
}
