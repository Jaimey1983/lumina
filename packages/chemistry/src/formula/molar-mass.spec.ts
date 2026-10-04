import { describe, expect, it } from 'vitest';

import { molarMass } from './molar-mass.js';

describe('molarMass', () => {
  it('H2SO4 entre 96 y 99 g/mol', () => {
    const m = molarMass('H2SO4');
    expect(m).toBeGreaterThan(96);
    expect(m).toBeLessThan(99);
  });

  it('Ca(OH)2', () => {
    expect(molarMass('Ca(OH)2')).toBeGreaterThan(70);
  });

  it('inválida', () => {
    expect(molarMass('@@@')).toBeNull();
  });
});
