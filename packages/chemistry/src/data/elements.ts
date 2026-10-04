import { elementsDataset } from './elements.dataset.js';

export type ElementCategory =
  | 'alkali_metal'
  | 'alkaline_earth'
  | 'transition_metal'
  | 'post_transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble_gas'
  | 'lanthanide'
  | 'actinide';

export interface PeriodicElement {
  z: number;
  symbol: string;
  name: string;
  atomicMass: number;
  group: number | null;
  period: number;
  category: ElementCategory;
  /** Punto de fusión (K); `null` si no está establecido. */
  meltK?: number | null;
  /** Punto de ebullición (K); `null` si no está establecido. */
  boilK?: number | null;
  /** Descubridor (o «Conocido desde la antigüedad»); `null` si no consta. */
  discoveredBy?: string | null;
}

export interface ElementsMetadata {
  sourceVersion: string;
  license: string;
  locale: string;
  elementCount: number;
}

export interface ElementsDataset {
  metadata: ElementsMetadata;
  elements: PeriodicElement[];
}

const dataset = elementsDataset as ElementsDataset;

const bySymbol = new Map<string, PeriodicElement>();
for (const el of dataset.elements) {
  bySymbol.set(el.symbol, el);
}

export function getElementsMetadata(): ElementsMetadata {
  return dataset.metadata;
}

export function getAllElements(): readonly PeriodicElement[] {
  return dataset.elements;
}

export function getElementBySymbol(symbol: string): PeriodicElement | undefined {
  return bySymbol.get(symbol);
}

export function getAtomicMass(symbol: string): number | undefined {
  return bySymbol.get(symbol)?.atomicMass;
}
