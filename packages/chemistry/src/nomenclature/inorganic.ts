import { normalizeFormula } from '../formula/normalize.js';
import { formulasEqual } from '../formula/parse.js';

/** V1: diccionario acotado nombre (es) → fórmula. */
const STOCK_NAMES: Record<string, string> = {
  agua: 'H2O',
  'dioxido de carbono': 'CO2',
  'monoxido de carbono': 'CO',
  'cloruro de sodio': 'NaCl',
  'cloruro de potasio': 'KCl',
  'oxido de calcio': 'CaO',
  'oxido de magnesio': 'MgO',
  'oxido de hierro iii': 'Fe2O3',
  'oxido de hierro ii': 'FeO',
  'hidroxido de sodio': 'NaOH',
  'hidroxido de calcio': 'Ca(OH)2',
  'acido clorhidrico': 'HCl',
  'acido sulfurico': 'H2SO4',
  'acido nitrico': 'HNO3',
  'sulfato de cobre ii': 'CuSO4',
  'nitrato de plata': 'AgNO3',
  amoniaco: 'NH3',
  metano: 'CH4',
  etanol: 'C2H5OH',
  'peroxido de hidrogeno': 'H2O2',
  ozono: 'O3',
};

function normalizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' ');
}

export function nameToFormula(name: string): string | null {
  const key = normalizeName(name);
  return STOCK_NAMES[key] ?? null;
}

export function formulaFromName(name: string): string | null {
  const direct = nameToFormula(name);
  if (direct) return normalizeFormula(direct);
  return normalizeFormula(name);
}

export function answerMatchesFormula(expectedFormula: string, studentAnswer: string): boolean {
  if (formulasEqual(expectedFormula, studentAnswer)) return true;
  const fromName = formulaFromName(studentAnswer);
  if (fromName && formulasEqual(expectedFormula, fromName)) return true;
  return false;
}
