import { flattenCounts, parseFormula } from '../formula/parse.js';
import { parseEquation, type ParsedEquation } from './parse.js';

export interface BalancedEquation {
  equation: ParsedEquation;
  coefficients: number[];
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function gcdArray(nums: number[]): number {
  return nums.reduce((a, b) => gcd(a, b), 0) || 1;
}

/** Elimina filas duplicadas y resuelve el sistema homogéneo Ax=0 con enteros mínimos. */
function solveIntegerCoefficients(
  matrix: number[][],
  speciesCount: number,
): number[] | null {
  const rows = matrix.length;
  if (rows === 0) return null;

  const m = matrix.map((r) => [...r]);
  const cols = speciesCount;
  let pivotCol = 0;
  const pivotRowForCol: number[] = new Array(cols).fill(-1);

  for (let r = 0; r < rows && pivotCol < cols; r++) {
    let pivot = -1;
    for (let i = r; i < rows; i++) {
      if (m[i]![pivotCol] !== 0) {
        pivot = i;
        break;
      }
    }
    if (pivot === -1) {
      pivotCol++;
      r--;
      continue;
    }
    if (pivot !== r) {
      const tmp = m[r]!;
      m[r] = m[pivot]!;
      m[pivot] = tmp;
    }
    pivotRowForCol[pivotCol] = r;
    const pivotVal = m[r]![pivotCol];
    for (let c = 0; c < cols; c++) {
      if (c !== pivotCol) m[r]![c] /= pivotVal;
    }
    m[r]![pivotCol] = 1;
    for (let i = 0; i < rows; i++) {
      if (i === r) continue;
      const factor = m[i]![pivotCol];
      if (factor === 0) continue;
      for (let c = 0; c < cols; c++) {
        m[i]![c] -= factor * m[r]![c];
      }
    }
    pivotCol++;
  }

  const freeCols: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (pivotRowForCol[c] === -1) freeCols.push(c);
  }
  if (freeCols.length !== 1) return null;

  const free = freeCols[0]!;
  const coeffs = new Array<number>(cols).fill(0);
  coeffs[free] = 1;

  for (let c = 0; c < cols; c++) {
    if (c === free) continue;
    const pr = pivotRowForCol[c];
    if (pr >= 0) coeffs[c] = -m[pr]![free];
  }

  const scale = 1000;
  const scaled = coeffs.map((x) => Math.round(x * scale));
  const g = gcdArray(scaled.filter((x) => x !== 0));
  const ints = scaled.map((x) => x / g);
  if (ints.some((x) => !Number.isFinite(x) || x <= 0)) return null;
  const g2 = gcdArray(ints);
  return ints.map((x) => x / g2);
}

export function balanceEquation(raw: string): BalancedEquation | null {
  const equation = parseEquation(raw);
  if (!equation) return null;

  const species = equation.species;
  const elementSet = new Set<string>();
  const speciesCounts = species.map((f) => {
    const p = parseFormula(f);
    if (!p) return null;
    const counts = flattenCounts(p);
    for (const el of Object.keys(counts)) elementSet.add(el);
    return counts;
  });
  if (speciesCounts.some((c) => c === null)) return null;

  const elements = [...elementSet].sort();
  const matrix: number[][] = elements.map((el) => {
    const rowReact = equation.reactants.map((_, i) => speciesCounts[i]![el] ?? 0);
    const rowProd = equation.products.map((_, j) => {
      const idx = equation.reactants.length + j;
      return -(speciesCounts[idx]![el] ?? 0);
    });
    return [...rowReact, ...rowProd];
  });

  const coeffs = solveIntegerCoefficients(matrix, species.length);
  if (!coeffs) return null;
  return { equation, coefficients: coeffs };
}

export function coefficientsEquivalent(a: number[], b: number[]): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const norm = (v: number[]) => {
    const g = gcdArray(v.map((x) => Math.abs(Math.round(x))));
    return v.map((x) => Math.round(x) / g);
  };
  const na = norm(a);
  const nb = norm(b);
  return na.every((x, i) => x === nb[i]);
}
