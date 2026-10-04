import { flattenCounts, normalizeFormulaInput, parseFormula } from './parse.js';

/** Clave canónica ordenada para comparar fórmulas equivalentes (H2O ≡ OH2 no, pero H2O ≡ H₂O sí). */
export function normalizeFormula(raw: string): string | null {
  const parsed = parseFormula(raw);
  if (!parsed) return null;
  const counts = flattenCounts(parsed);
  const parts = Object.keys(counts)
    .sort()
    .map((el) => (counts[el] === 1 ? el : `${el}${counts[el]}`));
  let base = parts.join('');
  if (parsed.charge !== 0) {
    const mag = Math.abs(parsed.charge);
    base += parsed.charge > 0 ? `+${mag > 1 ? mag : ''}` : `-${mag > 1 ? mag : ''}`;
  }
  return base;
}

export function formulasEqual(a: string, b: string): boolean {
  const na = normalizeFormula(a);
  const nb = normalizeFormula(b);
  if (!na || !nb) return false;
  return na === nb;
}

export function sanitizeFormulaAnswer(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return normalizeFormulaInput(raw);
}
