import { normalizeFormulaInput } from '../formula/parse.js';

export interface ParsedEquation {
  reactants: string[];
  products: string[];
  species: string[];
}

const ARROW_RE = /(?:->|=>|→|⟶|=)/;

export function parseEquation(raw: string): ParsedEquation | null {
  const s = raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/->/g, ' -> ')
    .replace(/=>/g, ' -> ')
    .replace(/→/g, ' -> ')
    .replace(/⟶/g, ' -> ');
  const parts = s.split(ARROW_RE).map((p) => p.trim());
  if (parts.length !== 2) return null;
  const splitSide = (side: string) =>
    side
      .split('+')
      .map((x) => normalizeFormulaInput(x.trim()))
      .filter(Boolean);
  const reactants = splitSide(parts[0]!);
  const products = splitSide(parts[1]!);
  if (reactants.length === 0 || products.length === 0) return null;
  if (reactants.some((f) => f.length > 80) || products.some((f) => f.length > 80)) return null;
  return { reactants, products, species: [...reactants, ...products] };
}
