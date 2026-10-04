import { ChemistryParseError } from '../errors.js';
import { normalizeFormulaInput } from '../formula/normalize.js';
import { parseFormula } from '../formula/parse.js';
import type { ParsedFormula } from '../formula/parse.js';

export interface EquationSpecies {
  /** Fórmula tal como apareció (sin coeficiente). */
  rawFormula: string;
  parsed: ParsedFormula;
  /** Estados físicos opcionales (s), (l), (g), (aq) — ignorados en balanceo. */
  state?: string;
}

export interface ParsedEquation {
  reactants: EquationSpecies[];
  products: EquationSpecies[];
}

const ARROW_PATTERN = /(->|=>|→|⟶|⇌|<=|=<)/;

function stripState(formula: string): { core: string; state?: string } {
  const m = formula.match(/^(.+?)\s*\(([slgaq]{1,3})\)\s*$/i);
  if (m) return { core: m[1].trim(), state: m[2].toLowerCase() };
  return { core: formula.trim() };
}

function splitSide(side: string): string[] {
  return side
    .split('+')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseSpecies(token: string): EquationSpecies {
  const withoutCoeff = token.replace(/^[0-9]+\s*/, '').trim();
  const { core, state } = stripState(withoutCoeff);
  if (!core) throw new ChemistryParseError('Especie vacía en la ecuación');
  const parsed = parseFormula(core);
  return { rawFormula: core, parsed, state };
}

/** Parsea una ecuación química (reactivos y productos separados por flecha). */
export function parseEquation(input: string): ParsedEquation {
  const normalized = normalizeFormulaInput(input).replace(/\s+/g, ' ');
  if (normalized.length > 1024) {
    throw new ChemistryParseError('Ecuación demasiado larga');
  }
  const arrowMatch = normalized.match(ARROW_PATTERN);
  if (!arrowMatch || arrowMatch.index === undefined) {
    throw new ChemistryParseError('Falta flecha de reacción (->, →, ⇌, …)');
  }
  const left = normalized.slice(0, arrowMatch.index).trim();
  const right = normalized.slice(arrowMatch.index + arrowMatch[0].length).trim();
  if (!left || !right) {
    throw new ChemistryParseError('Lado de la ecuación vacío');
  }

  const reactants = splitSide(left).map(parseSpecies);
  const products = splitSide(right).map(parseSpecies);
  if (reactants.length === 0 || products.length === 0) {
    throw new ChemistryParseError('Se requiere al menos un reactivo y un producto');
  }
  return { reactants, products };
}
