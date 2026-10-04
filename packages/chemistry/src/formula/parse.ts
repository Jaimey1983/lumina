import { ChemistryParseError } from '../errors.js';
import { getAtomicMass } from '../data/elements.js';
import { normalizeFormulaInput } from './normalize.js';

export const MAX_FORMULA_LENGTH = 256;

export interface ParsedFormula {
  /** Conteo de átomos por símbolo elementar (ej. { H: 2, O: 1 }). */
  atoms: Record<string, number>;
  /** Carga neta (positiva = catión). 0 si neutra. */
  charge: number;
}

const ELEMENT_PATTERN = /^[A-Z][a-z]?/;
const ALLOWED_CHARS = /^[A-Za-z0-9().·+\-^]+$/;

function mergeCounts(target: Record<string, number>, source: Record<string, number>, factor = 1): void {
  for (const [el, count] of Object.entries(source)) {
    target[el] = (target[el] ?? 0) + count * factor;
  }
}

function countElementSymbols(fragment: string): number {
  const matches = fragment.match(/[A-Z][a-z]?/g);
  return matches?.length ?? 0;
}

function parseChargeSuffix(s: string): { formulaPart: string; charge: number } {
  const caret = s.match(/\^([0-9]*)([+-])$/);
  if (caret) {
    const mag = caret[1] === '' ? 1 : Number.parseInt(caret[1], 10);
    const charge = caret[2] === '+' ? mag : -mag;
    return { formulaPart: s.slice(0, -caret[0].length), charge };
  }

  const elementIon = s.match(/^([A-Z][a-z]?)(\d*)([+-])$/);
  if (elementIon) {
    const mag = elementIon[2] === '' ? 1 : Number.parseInt(elementIon[2], 10);
    const charge = elementIon[3] === '+' ? mag : -mag;
    return { formulaPart: elementIon[1], charge };
  }

  const polyIon = s.match(/^(.+)(\d+)([+-])$/);
  if (polyIon) {
    const formulaPart = polyIon[1];
    const mag = Number.parseInt(polyIon[2], 10);
    const looksPolyatomic =
      countElementSymbols(formulaPart) >= 2 && (/\d/.test(formulaPart) || formulaPart.includes('('));
    if (mag >= 1 && mag <= 9 && looksPolyatomic) {
      const charge = polyIon[3] === '+' ? mag : -mag;
      return { formulaPart, charge };
    }
  }

  const last = s.at(-1);
  if (last === '+' || last === '-') {
    const charge = last === '+' ? 1 : -1;
    return { formulaPart: s.slice(0, -1), charge };
  }

  return { formulaPart: s, charge: 0 };
}

function parseSegment(segment: string, pos: number): { atoms: Record<string, number>; end: number } {
  const atoms: Record<string, number> = {};
  let i = pos;

  while (i < segment.length) {
    const ch = segment[i];
    if (ch === ' ') {
      i += 1;
      continue;
    }
    if (ch === '(') {
      const inner = parseSegment(segment, i + 1);
      i = inner.end;
      if (segment[i] !== ')') {
        throw new ChemistryParseError(`Paréntesis sin cerrar en posición ${i}`);
      }
      i += 1;
      const mult = readCount(segment, i);
      i = mult.end;
      mergeCounts(atoms, inner.atoms, mult.value);
      continue;
    }
    if (ch === ')') {
      return { atoms, end: i };
    }

    const rest = segment.slice(i);
    const elMatch = rest.match(ELEMENT_PATTERN);
    if (!elMatch) {
      throw new ChemistryParseError(`Símbolo elementar inválido cerca de «${rest.slice(0, 8)}»`);
    }
    const symbol = elMatch[0];
    i += symbol.length;
    const count = readCount(segment, i);
    i = count.end;
    atoms[symbol] = (atoms[symbol] ?? 0) + count.value;
  }

  return { atoms, end: i };
}

function readCount(segment: string, pos: number): { value: number; end: number } {
  const m = segment.slice(pos).match(/^([0-9]+)/);
  if (!m) return { value: 1, end: pos };
  const value = Number.parseInt(m[1], 10);
  if (value <= 0 || value > 999) {
    throw new ChemistryParseError(`Subíndice fuera de rango: ${m[1]}`);
  }
  return { value, end: pos + m[1].length };
}

function parseFormulaCore(raw: string): ParsedFormula {
  const normalized = normalizeFormulaInput(raw);
  if (normalized.length > MAX_FORMULA_LENGTH) {
    throw new ChemistryParseError(`Fórmula demasiado larga (máx. ${MAX_FORMULA_LENGTH})`);
  }
  if (!ALLOWED_CHARS.test(normalized)) {
    throw new ChemistryParseError('Caracteres no permitidos en la fórmula');
  }

  const { formulaPart, charge } = parseChargeSuffix(normalized);
  const parts = formulaPart.split('·').filter((p) => p.length > 0);
  if (parts.length === 0) {
    throw new ChemistryParseError('Fórmula vacía');
  }

  const total: Record<string, number> = {};
  for (const part of parts) {
    let segment = part;
    let hydrateMult = 1;
    const hydrateLead = segment.match(/^([0-9]+)(.+)$/);
    if (hydrateLead && /[A-Za-z(]/.test(hydrateLead[2][0] ?? '')) {
      hydrateMult = Number.parseInt(hydrateLead[1], 10);
      segment = hydrateLead[2];
    }
    const parsed = parseSegment(segment, 0);
    if (parsed.end !== segment.length) {
      throw new ChemistryParseError(`Fragmento no reconocido en «${part}»`);
    }
    mergeCounts(total, parsed.atoms, hydrateMult);
  }

  for (const symbol of Object.keys(total)) {
    if (getAtomicMass(symbol) === undefined) {
      throw new ChemistryParseError(`Elemento desconocido: ${symbol}`);
    }
  }

  return { atoms: total, charge };
}

/** Parsea una fórmula química (paréntesis, hidratos «·», cargas simples). */
export function parseFormula(input: string): ParsedFormula {
  try {
    return parseFormulaCore(input);
  } catch (e) {
    if (e instanceof ChemistryParseError) throw e;
    throw new ChemistryParseError('No se pudo interpretar la fórmula');
  }
}

/** Suma conteos de átomos (útil tras expandir hidratos manualmente). */
export function addAtomCounts(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  mergeCounts(out, b);
  return out;
}
