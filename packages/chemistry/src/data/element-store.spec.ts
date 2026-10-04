import { describe, expect, it } from 'vitest';

import { allElements, lookupElement } from './element-store.js';

describe('element dataset', () => {
  it('118 elementos', () => {
    expect(allElements().length).toBe(118);
  });

  it('Fe tiene periodo y grupo', () => {
    const fe = lookupElement('Fe');
    expect(fe?.periodo).toBeGreaterThan(0);
    expect(fe?.grupo).toBeGreaterThan(0);
  });

  it('por número atómico', () => {
    expect(lookupElement(8)?.symbol).toBe('O');
  });
});
