import { balanceEquation } from '../equation/balance.js';
import { parseEquation } from '../equation/parse.js';
import { molarMass } from '../formula/molar-mass.js';

/** Moles a partir de masa (g) y fórmula. */
export function massToMoles(massGrams: number, formula: string): number | null {
  if (!Number.isFinite(massGrams) || massGrams < 0) return null;
  const mm = molarMass(formula);
  if (mm === null || mm <= 0) return null;
  return massGrams / mm;
}

/** Masa (g) a partir de moles y fórmula. */
export function molesToMass(moles: number, formula: string): number | null {
  if (!Number.isFinite(moles) || moles < 0) return null;
  const mm = molarMass(formula);
  if (mm === null || mm <= 0) return null;
  return Math.round(moles * mm * 1000) / 1000;
}

/**
 * Relación molar entre dos fórmulas en una ecuación balanceada:
 * moles(B) / moles(A) con coeficientes mínimos enteros.
 */
export function moleRatio(
  equation: string,
  formulaA: string,
  formulaB: string,
): number | null {
  const balanced = balanceEquation(equation);
  if (!balanced) return null;
  const norm = (f: string) => f.replace(/\s+/g, '');
  const targetA = norm(formulaA);
  const targetB = norm(formulaB);
  const species = balanced.equation.species.map(norm);
  const idxA = species.indexOf(targetA);
  const idxB = species.indexOf(targetB);
  if (idxA < 0 || idxB < 0) return null;
  const coeffA = balanced.coefficients[idxA]!;
  const coeffB = balanced.coefficients[idxB]!;
  if (coeffA <= 0) return null;
  return coeffB / coeffA;
}

/** Moles de producto obtenibles si se consume toda la masa de un reactivo (sin reactivo limitante mixto). */
export function productMolesFromReactantMass(
  equation: string,
  reactantFormula: string,
  reactantMassGrams: number,
  productFormula: string,
): number | null {
  const eq = parseEquation(equation);
  if (!eq) return null;
  const norm = (f: string) => f.replace(/\s+/g, '');
  if (!eq.reactants.map(norm).includes(norm(reactantFormula))) return null;
  const molesIn = massToMoles(reactantMassGrams, reactantFormula);
  if (molesIn === null) return null;
  const ratio = moleRatio(equation, reactantFormula, productFormula);
  if (ratio === null) return null;
  return Math.round(molesIn * ratio * 1e9) / 1e9;
}
