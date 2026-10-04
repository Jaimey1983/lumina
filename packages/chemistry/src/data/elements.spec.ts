import { describe, expect, it } from 'vitest';
import { getAllElements, getElementBySymbol, getElementsMetadata } from './elements.js';

describe('elements dataset', () => {
  it('tiene 118 elementos', () => {
    expect(getAllElements()).toHaveLength(118);
    expect(getElementsMetadata().elementCount).toBe(118);
  });

  it('incluye metadatos IUPAC', () => {
    expect(getElementsMetadata().sourceVersion).toMatch(/IUPAC/);
  });

  it('resuelve Fe', () => {
    const fe = getElementBySymbol('Fe');
    expect(fe?.name).toBe('Hierro');
    expect(fe?.z).toBe(26);
  });
});
