import { describe, expect, it } from 'vitest';

import { formulasEqual, normalizeFormula } from './normalize.js';

describe('normalizeFormula', () => {
  it('H₂O', () => {
    expect(normalizeFormula('H₂O')).toBe('H2O');
  });

  it('formulasEqual', () => {
    expect(formulasEqual('H2O', 'CO2')).toBe(false);
    expect(formulasEqual('H2O', 'H₂O')).toBe(true);
  });
});
