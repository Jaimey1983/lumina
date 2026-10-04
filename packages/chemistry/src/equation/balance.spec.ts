import { describe, expect, it } from 'vitest';

import { balanceEquation, coefficientsEquivalent } from './balance.js';

describe('balanceEquation', () => {
  it('H2 + O2 -> H2O', () => {
    const b = balanceEquation('H2 + O2 -> H2O');
    expect(coefficientsEquivalent(b!.coefficients, [2, 1, 2])).toBe(true);
  });

  it('Fe + O2 -> Fe2O3', () => {
    const b = balanceEquation('Fe + O2 -> Fe2O3');
    expect(coefficientsEquivalent(b!.coefficients, [4, 3, 2])).toBe(true);
  });

  it('combustión CH4', () => {
    const b = balanceEquation('CH4 + O2 -> CO2 + H2O');
    expect(b).not.toBeNull();
    expect(coefficientsEquivalent(b!.coefficients, [1, 2, 1, 2])).toBe(true);
  });

  it('descomposición H2O2', () => {
    const b = balanceEquation('H2O2 -> H2O + O2');
    expect(coefficientsEquivalent(b!.coefficients, [2, 2, 1])).toBe(true);
  });

  it('ácido-base HCl + NaOH', () => {
    const b = balanceEquation('HCl + NaOH -> NaCl + H2O');
    expect(coefficientsEquivalent(b!.coefficients, [1, 1, 1, 1])).toBe(true);
  });

  it('ecuación inválida', () => {
    expect(balanceEquation('solo texto')).toBeNull();
  });

  it('sin conservación posible (enteros)', () => {
    expect(balanceEquation('He -> H2')).toBeNull();
  });
});

describe('coefficientsEquivalent', () => {
  it('escalar múltiple', () => {
    expect(coefficientsEquivalent([2, 1, 2], [4, 2, 4])).toBe(true);
  });

  it('distinto ratio', () => {
    expect(coefficientsEquivalent([2, 1, 2], [1, 1, 1])).toBe(false);
  });
});
