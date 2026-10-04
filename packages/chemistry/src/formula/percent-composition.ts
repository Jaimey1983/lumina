import { lookupElement } from '../data/element-store.js';
import { flattenCounts, parseFormula } from './parse.js';
import { molarMassFromCounts } from './molar-mass.js';

export interface ElementMassPercent {
  element: string;
  percent: number;
}

/** Porcentaje en masa por elemento. Redondeo a 2 decimales (DQ2 / Q1b). */
export function percentComposition(formula: string): ElementMassPercent[] | null {
  const parsed = parseFormula(formula);
  if (!parsed) return null;
  const counts = flattenCounts(parsed);
  const totalMass = molarMassFromCounts(counts);
  if (totalMass === null || totalMass <= 0) return null;

  const rows: ElementMassPercent[] = [];
  for (const [element, amount] of Object.entries(counts)) {
    const record = lookupElement(element);
    if (!record) return null;
    const mass = record.masaAtomica * amount;
    const percent = Math.round((mass / totalMass) * 10000) / 100;
    rows.push({ element, percent });
  }
  rows.sort((a, b) => a.element.localeCompare(b.element));
  return rows;
}
