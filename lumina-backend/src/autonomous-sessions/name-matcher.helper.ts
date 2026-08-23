import { distance } from 'fastest-levenshtein';

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

export function applyPhonetics(name: string): string {
  return name
    .replace(/v/g, 'b')
    .replace(/z/g, 's')
    .replace(/c([ei])/g, 's$1')
    .replace(/ll/g, 'y')
    .replace(/^h|(?<=\s)h/g, '')
    .replace(/j([ei])/g, 'g$1')
    .replace(/qu/g, 'k')
    .replace(/x/g, 'ks');
}

export function levenshteinTolerance(name: string): number {
  const len = name.length;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 3;
}

export function namesMatch(incoming: string, stored: string): boolean {
  const a = applyPhonetics(normalizeName(incoming));
  const b = applyPhonetics(normalizeName(stored));
  if (a === b) return true;
  const tolerance = levenshteinTolerance(b);
  return distance(a, b) <= tolerance;
}