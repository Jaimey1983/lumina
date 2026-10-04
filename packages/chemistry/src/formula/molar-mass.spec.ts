import { describe, expect, it } from 'vitest';
import { computeMolarMass, molesFromMass } from './molar-mass.js';
import { computePercentComposition } from './percent-composition.js';

describe('computeMolarMass', () => {
  it('calcula H2SO4 ≈ 98.08', () => {
    const { molarMass } = computeMolarMass('H2SO4');
    expect(molarMass).toBeGreaterThan(98);
    expect(molarMass).toBeLessThan(98.1);
  });

  it('calcula Ca(OH)2 ≈ 74.09', () => {
    const { molarMass } = computeMolarMass('Ca(OH)2');
    expect(molarMass).toBeGreaterThan(74);
    expect(molarMass).toBeLessThan(74.2);
  });

  it('calcula NaCl', () => {
    const { molarMass } = computeMolarMass('NaCl');
    expect(molarMass).toBeCloseTo(58.44, 1);
  });
});

describe('computePercentComposition', () => {
  it('H2O tiene ~11% H', () => {
    const { entries } = computePercentComposition('H2O');
    const h = entries.find((e) => e.symbol === 'H');
    expect(h?.percent).toBeGreaterThan(10);
    expect(h?.percent).toBeLessThan(12);
  });
});

describe('molesFromMass', () => {
  it('18.015 g de H2O ≈ 1 mol', () => {
    const moles = molesFromMass(18.015, 'H2O');
    expect(moles).toBeCloseTo(1, 2);
  });
});
