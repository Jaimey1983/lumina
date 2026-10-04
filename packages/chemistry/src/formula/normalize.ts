const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
};

/** Normaliza fórmulas Unicode (subíndices, puntos de hidrato) a ASCII seguro para el parser. */
export function normalizeFormulaInput(raw: string): string {
  let s = raw.trim();
  if (s.length === 0) return s;
  s = s.replace(/\u00B7|\u22C5|\*/g, '·');
  s = s.replace(/[₀-₉]/g, (ch) => SUBSCRIPT_MAP[ch] ?? ch);
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, (ch) => SUPERSCRIPT_MAP[ch] ?? ch);
  return s;
}

/** Alias estable para Q4/nomenclatura (misma normalización que el parser). */
export function normalizeFormula(raw: string): string {
  return normalizeFormulaInput(raw);
}
