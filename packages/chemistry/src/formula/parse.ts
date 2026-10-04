/** Subíndices Unicode → ASCII. */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function digitFromSub(ch: string): string {
  const i = SUB.indexOf(ch);
  return i >= 0 ? String(i) : ch;
}

function digitFromSup(ch: string): string {
  const i = SUP.indexOf(ch);
  return i >= 0 ? String(i) : ch;
}

/** Normaliza fórmula a ASCII con subíndices numéricos. */
export function normalizeFormulaInput(raw: string): string {
  let out = '';
  for (const ch of raw.trim()) {
    if (SUB.includes(ch)) out += digitFromSub(ch);
    else if (SUP.includes(ch)) out += `^${digitFromSup(ch)}`;
    else if (ch === '·' || ch === '•') out += '·';
    else out += ch;
  }
  return out.replace(/\s+/g, '');
}

export type ElementCounts = Record<string, number>;

export interface ParsedFormula {
  counts: ElementCounts;
  charge: number;
  hydrate?: { formula: ParsedFormula; count: number };
}

const ELEMENT_RE = /^[A-Z][a-z]?/;

function parseSegment(segment: string): ParsedFormula {
  let i = 0;
  const counts: ElementCounts = {};
  let charge = 0;

  const readNumber = (): number => {
    let n = '';
    while (i < segment.length && /\d/.test(segment[i]!)) {
      n += segment[i];
      i++;
    }
    return n ? parseInt(n, 10) : 1;
  };

  const merge = (src: ElementCounts, mult: number) => {
    for (const [el, c] of Object.entries(src)) {
      counts[el] = (counts[el] ?? 0) + c * mult;
    }
  };

  while (i < segment.length) {
    const ch = segment[i]!;
    if (ch === '(') {
      i++;
      const start = i;
      let depth = 1;
      while (i < segment.length && depth > 0) {
        if (segment[i] === '(') depth++;
        if (segment[i] === ')') depth--;
        if (depth > 0) i++;
      }
      const inner = segment.slice(start, i);
      i++; // skip )
      const mult = readNumber();
      const innerParsed = parseSegment(inner);
      merge(innerParsed.counts, mult);
      charge += innerParsed.charge * mult;
      continue;
    }
    if (ch === '+' || ch === '-') {
      const sign = ch === '+' ? 1 : -1;
      i++;
      let n = '';
      while (i < segment.length && /\d/.test(segment[i]!)) {
        n += segment[i];
        i++;
      }
      charge += sign * (n ? parseInt(n, 10) : 1);
      continue;
    }
    const rest = segment.slice(i);
    const m = rest.match(ELEMENT_RE);
    if (!m) {
      throw new Error(`Símbolo químico inválido cerca de: ${segment.slice(i, i + 8)}`);
    }
    const sym = m[0];
    i += sym.length;
    const mult = readNumber();
    counts[sym] = (counts[sym] ?? 0) + mult;
  }

  return { counts, charge };
}

/** Parsea fórmula con paréntesis, hidratos (·) y carga simple al final. */
export function parseFormula(raw: string): ParsedFormula | null {
  const trimmed = raw.trim();
  if (/eval\s*\(/i.test(trimmed)) return null;
  const s = normalizeFormulaInput(raw);
  if (!s) return null;
  if (/[;=<>]/.test(s) || s.includes('->')) return null;
  // «+» entre especies (p. ej. H2+O2) no es una fórmula válida aquí.
  const withoutTrailingCharge = s.replace(/[+-]\d*$/, '');
  if (withoutTrailingCharge.includes('+')) return null;
  if (s.length > 120) return null;

  const hydrateParts = s.split('·');
  try {
    const main = parseSegment(hydrateParts[0]!);
    if (hydrateParts.length === 1) return main;
    const hydrateRaw = hydrateParts.slice(1).join('·');
    const hydrateParsed = parseSegment(hydrateRaw);
    return {
      counts: main.counts,
      charge: main.charge,
      hydrate: { formula: hydrateParsed, count: 1 },
    };
  } catch {
    return null;
  }
}

export function flattenCounts(parsed: ParsedFormula): ElementCounts {
  const out: ElementCounts = { ...parsed.counts };
  if (parsed.hydrate) {
    const inner = flattenCounts(parsed.hydrate.formula);
    for (const [el, c] of Object.entries(inner)) {
      out[el] = (out[el] ?? 0) + c * parsed.hydrate.count;
    }
  }
  return out;
}
