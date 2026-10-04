import { ELEMENTS_DATASET as elementsDoc } from './elements-data.js';
import type { ElementRecord, ElementsDataset } from './element-store-types.js';

export type { ElementRecord, ElementsDataset };

export const ELEMENTS_DATASET = elementsDoc;

const bySymbol = new Map<string, ElementRecord>();
const byZ = new Map<number, ElementRecord>();

for (const el of ELEMENTS_DATASET.elements) {
  bySymbol.set(el.symbol.toLowerCase(), el);
  byZ.set(el.Z, el);
}

export function lookupElement(symbolOrZ: string | number): ElementRecord | null {
  if (typeof symbolOrZ === 'number') return byZ.get(symbolOrZ) ?? null;
  const s = symbolOrZ.trim();
  if (!s) return null;
  const asNum = Number(s);
  if (Number.isInteger(asNum) && asNum > 0) return byZ.get(asNum) ?? null;
  return bySymbol.get(s.replace(/^(\d+)/, '').toLowerCase()) ?? bySymbol.get(s.toLowerCase()) ?? null;
}

export function allElements(): readonly ElementRecord[] {
  return ELEMENTS_DATASET.elements;
}
