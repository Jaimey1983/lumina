import { ChemistryParseError } from '../errors.js';
import { computeMolarMass } from './molar-mass.js';
import { getAtomicMass } from '../data/elements.js';

export interface PercentCompositionEntry {
  symbol: string;
  massFraction: number;
  percent: number;
}

export interface PercentCompositionResult {
  entries: PercentCompositionEntry[];
  molarMass: number;
}

/** Composición porcentual en masa por elemento. */
export function computePercentComposition(formulaInput: string): PercentCompositionResult {
  const { molarMass, formula } = computeMolarMass(formulaInput);
  if (molarMass <= 0) throw new ChemistryParseError('Masa molar inválida');

  const entries: PercentCompositionEntry[] = [];
  for (const [symbol, count] of Object.entries(formula.atoms)) {
    const mass = getAtomicMass(symbol);
    if (mass === undefined) {
      throw new ChemistryParseError(`Elemento desconocido: ${symbol}`);
    }
    const massFraction = (mass * count) / molarMass;
    entries.push({
      symbol,
      massFraction,
      percent: Math.round(massFraction * 10000) / 100,
    });
  }

  entries.sort((a, b) => b.percent - a.percent);
  return { entries, molarMass };
}
