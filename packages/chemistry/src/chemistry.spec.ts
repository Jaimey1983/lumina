import { describe, expect, it } from 'vitest';

import {
  answerMatchesFormula,
  balanceEquation,
  coefficientsEquivalent,
  formulasEqual,
  lookupElement,
  molarMass,
  normalizeFormula,
  parseEquation,
  parseFormula,
} from './index.js';

describe('parseFormula', () => {
  it('H2SO4 y Ca(OH)2', () => {
    expect(parseFormula('H2SO4')).not.toBeNull();
    expect(parseFormula('Ca(OH)2')).not.toBeNull();
    expect(parseFormula('Fe2(SO4)3')).not.toBeNull();
  });

  it('rechaza entrada hostil', () => {
    expect(parseFormula('eval(1)')).toBeNull();
    expect(parseFormula('')).toBeNull();
    expect(parseFormula('H2 + O2')).toBeNull();
  });
});

describe('molarMass', () => {
  it('H2SO4', () => {
    const m = molarMass('H2SO4');
    expect(m).not.toBeNull();
    expect(m!).toBeGreaterThan(95);
    expect(m!).toBeLessThan(99);
  });
});

describe('balanceEquation', () => {
  it('H2 + O2 -> H2O', () => {
    const b = balanceEquation('H2 + O2 -> H2O');
    expect(b).not.toBeNull();
    expect(coefficientsEquivalent(b!.coefficients, [2, 1, 2])).toBe(true);
  });

  it('Fe + O2 -> Fe2O3', () => {
    const b = balanceEquation('Fe + O2 -> Fe2O3');
    expect(b).not.toBeNull();
    expect(coefficientsEquivalent(b!.coefficients, [4, 3, 2])).toBe(true);
  });
});

describe('normalizeFormula', () => {
  it('H₂O ≡ H2O', () => {
    expect(formulasEqual('H₂O', 'H2O')).toBe(true);
    expect(normalizeFormula('H2O')).toBe('H2O');
  });
});

describe('lookupElement', () => {
  it('Fe', () => {
    const el = lookupElement('Fe');
    expect(el?.symbol).toBe('Fe');
    expect(el?.periodo).toBeGreaterThan(0);
  });
});

describe('parseEquation', () => {
  it('acepta flechas variadas', () => {
    expect(parseEquation('A -> B')?.products).toEqual(['B']);
    expect(parseEquation('A → B')?.products).toEqual(['B']);
  });
});

describe('nomenclature', () => {
  it('óxido de calcio', () => {
    expect(answerMatchesFormula('CaO', 'óxido de calcio')).toBe(true);
    expect(answerMatchesFormula('CaO', 'CaO')).toBe(true);
  });
});
