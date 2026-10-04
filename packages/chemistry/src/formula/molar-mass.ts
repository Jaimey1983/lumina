import { lookupElement } from '../data/element-store.js';
import { flattenCounts, parseFormula, type ElementCounts } from './parse.js';

export function molarMassFromCounts(counts: ElementCounts): number | null {
  let sum = 0;
  for (const [sym, n] of Object.entries(counts)) {
    const el = lookupElement(sym);
    if (!el || !Number.isFinite(el.masaAtomica)) return null;
    sum += el.masaAtomica * n;
  }
  return Math.round(sum * 1000) / 1000;
}

export function molarMass(formula: string): number | null {
  const parsed = parseFormula(formula);
  if (!parsed) return null;
  return molarMassFromCounts(flattenCounts(parsed));
}
