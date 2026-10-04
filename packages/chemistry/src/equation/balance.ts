import { ChemistryBalanceError } from '../errors.js';
import { parseEquation, type ParsedEquation } from './parse.js';

export interface BalancedEquation {
  equation: ParsedEquation;
  /** Coeficientes estequiométricos mínimos enteros positivos (reactivos luego productos). */
  coefficients: number[];
  reactantCoefficients: number[];
  productCoefficients: number[];
}

type Rational = { n: bigint; d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return (a / gcd(a, b)) * b;
}

function rat(n: number | bigint, d: number | bigint = 1n): Rational {
  const nn = typeof n === 'number' ? BigInt(n) : n;
  const dd = typeof d === 'number' ? BigInt(d) : d;
  if (dd === 0n) throw new ChemistryBalanceError('División por cero en balanceo');
  const g = gcd(nn, dd);
  return { n: nn / g, d: dd / g };
}

function add(a: Rational, b: Rational): Rational {
  return rat(a.n * b.d + b.n * a.d, a.d * b.d);
}

function sub(a: Rational, b: Rational): Rational {
  return rat(a.n * b.d - b.n * a.d, a.d * b.d);
}

function mul(a: Rational, b: Rational): Rational {
  return rat(a.n * b.n, a.d * b.d);
}

function neg(a: Rational): Rational {
  return rat(-a.n, a.d);
}

function isZero(a: Rational): boolean {
  return a.n === 0n;
}

function atomCountsList(equation: ParsedEquation): Record<string, number>[] {
  const species = [...equation.reactants, ...equation.products];
  return species.map((s) => s.parsed.atoms);
}

function buildMatrix(equation: ParsedEquation): { matrix: Rational[][]; speciesCount: number } {
  const counts = atomCountsList(equation);
  const elements = new Set<string>();
  for (const c of counts) {
    for (const el of Object.keys(c)) elements.add(el);
  }
  const elementList = [...elements].sort();
  const n = counts.length;
  const matrix: Rational[][] = elementList.map((el) => {
    const row: Rational[] = [];
    for (let i = 0; i < n; i += 1) {
      const inReactant = i < equation.reactants.length;
      const sign = inReactant ? 1 : -1;
      const count = counts[i][el] ?? 0;
      row.push(rat(sign * count));
    }
    return row;
  });
  return { matrix, speciesCount: n };
}

function solveNullspace(matrix: Rational[][]): Rational[][] {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const m = matrix.map((r) => [...r]);
  const pivotCols: number[] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c += 1) {
    let pivot = r;
    while (pivot < rows && isZero(m[pivot][c])) pivot += 1;
    if (pivot === rows) continue;
    if (pivot !== r) {
      [m[r], m[pivot]] = [m[pivot], m[r]];
    }
    const pivotVal = m[r][c];
    for (let j = c; j < cols; j += 1) {
      m[r][j] = rat(m[r][j].n * pivotVal.d, m[r][j].d * pivotVal.n);
    }
    for (let i = 0; i < rows; i += 1) {
      if (i === r || isZero(m[i][c])) continue;
      const factor = m[i][c];
      for (let j = c; j < cols; j += 1) {
        m[i][j] = sub(m[i][j], mul(factor, m[r][j]));
      }
    }
    pivotCols.push(c);
    r += 1;
  }

  const freeCols = [...Array(cols).keys()].filter((c) => !pivotCols.includes(c));
  const basis: Rational[][] = [];

  for (const free of freeCols) {
    const vec: Rational[] = Array.from({ length: cols }, () => rat(0));
    vec[free] = rat(1);
    for (let i = 0; i < pivotCols.length; i += 1) {
      const pc = pivotCols[i];
      const coeff = m[i][free];
      vec[pc] = neg(coeff);
    }
    basis.push(vec);
  }

  if (basis.length === 0) {
    throw new ChemistryBalanceError('No hay solución en coeficientes enteros positivos');
  }
  return basis;
}

function lcmAll(denoms: bigint[]): bigint {
  let acc = 1n;
  for (const d of denoms) {
    acc = lcm(acc, d);
  }
  return acc;
}

function vectorToIntegers(vec: Rational[]): number[] | null {
  const scale = lcmAll(vec.map((v) => v.d));
  const ints = vec.map((v) => Number((v.n * scale) / v.d));
  if (ints.some((x) => !Number.isInteger(x))) return null;
  const positives = ints.every((x) => x > 0);
  if (!positives) return null;
  let g = ints[0];
  for (const x of ints) g = Number(gcd(BigInt(g), BigInt(x)));
  return ints.map((x) => x / g);
}

function findMinimalPositiveCoefficients(basis: Rational[][]): number[] {
  const dim = basis[0]?.length ?? 0;
  if (dim === 0) throw new ChemistryBalanceError('Ecuación sin especies');

  const tryCombo = (depth: number, coeffs: number[], best: { sum: number; vec: number[] } | null) => {
    if (depth === basis.length) {
      const combined: Rational[] = Array.from({ length: dim }, () => rat(0));
      for (let i = 0; i < basis.length; i += 1) {
        const k = coeffs[i];
        if (k === 0) continue;
        for (let j = 0; j < dim; j += 1) {
          combined[j] = add(combined[j], mul(rat(k), basis[i][j]));
        }
      }
      const intVec = vectorToIntegers(combined);
      if (!intVec) return best;
      const sum = intVec.reduce((a, b) => a + b, 0);
      if (!best || sum < best.sum) return { sum, vec: intVec };
      return best;
    }
    let current = best;
    for (let k = 1; k <= 64; k += 1) {
      coeffs[depth] = k;
      current = tryCombo(depth + 1, coeffs, current);
    }
    return current;
  };

  const result = tryCombo(0, [], null);
  if (!result) {
    throw new ChemistryBalanceError('No hay solución en coeficientes enteros positivos');
  }
  return result.vec;
}

/** Balancea la ecuación con coeficientes estequiométricos mínimos (enteros positivos). */
export function balanceEquation(input: string): BalancedEquation {
  const equation = parseEquation(input);
  const { matrix, speciesCount } = buildMatrix(equation);
  if (speciesCount < 2) {
    throw new ChemistryBalanceError('Se necesitan al menos dos especies para balancear');
  }
  const basis = solveNullspace(matrix);
  const coefficients = findMinimalPositiveCoefficients(basis);
  if (coefficients.length !== speciesCount) {
    throw new ChemistryBalanceError('Error interno al asignar coeficientes');
  }
  const rCount = equation.reactants.length;
  return {
    equation,
    coefficients,
    reactantCoefficients: coefficients.slice(0, rCount),
    productCoefficients: coefficients.slice(rCount),
  };
}

/** Comprueba si los coeficientes dados balancean la ecuación (equivalente escalar permitido). */
export function coefficientsAreEquivalent(
  reference: number[],
  candidate: number[],
): boolean {
  if (reference.length !== candidate.length) return false;
  const ratios: number[] = [];
  for (let i = 0; i < reference.length; i += 1) {
    if (reference[i] === 0 || candidate[i] === 0) return false;
    ratios.push(candidate[i] / reference[i]);
  }
  const first = ratios[0];
  return ratios.every((r) => Math.abs(r - first) < 1e-9);
}

/** Formatea ecuación balanceada con coeficientes. */
export function formatBalancedEquation(balanced: BalancedEquation): string {
  const fmt = (species: { rawFormula: string }[], coeffs: number[]) =>
    species
      .map((s, i) => (coeffs[i] === 1 ? '' : String(coeffs[i])) + s.rawFormula)
      .join(' + ');
  const left = fmt(balanced.equation.reactants, balanced.reactantCoefficients);
  const right = fmt(balanced.equation.products, balanced.productCoefficients);
  return `${left} -> ${right}`;
}
