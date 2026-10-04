import { ChemistryParseError } from '../errors.js';
import { getAtomicMass } from '../data/elements.js';
import { parseFormula, type ParsedFormula } from './parse.js';

export interface MolarMassResult {
  molarMass: number;
  formula: ParsedFormula;
}

/** Masa molar (g/mol) con redondeo a 4 decimales. */
export function computeMolarMass(formulaInput: string): MolarMassResult {
  const formula = parseFormula(formulaInput);
  let sum = 0;
  for (const [symbol, count] of Object.entries(formula.atoms)) {
    const mass = getAtomicMass(symbol);
    if (mass === undefined) {
      throw new ChemistryParseError(`Elemento desconocido: ${symbol}`);
    }
    sum += mass * count;
  }
  const molarMass = Math.round(sum * 10000) / 10000;
  return { molarMass, formula };
}

/** Moles = masa (g) / masa molar. */
export function molesFromMass(massGrams: number, formulaInput: string): number {
  if (!Number.isFinite(massGrams) || massGrams < 0) {
    throw new ChemistryParseError('La masa debe ser un número finito ≥ 0');
  }
  const { molarMass } = computeMolarMass(formulaInput);
  if (molarMass === 0) throw new ChemistryParseError('Masa molar cero');
  return massGrams / molarMass;
}
