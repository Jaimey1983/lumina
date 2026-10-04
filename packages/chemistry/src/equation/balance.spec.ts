import { describe, expect, it } from 'vitest';
import { ChemistryBalanceError } from '../errors.js';
import { parseEquation } from './parse.js';
import {
  balanceEquation,
  coefficientsAreEquivalent,
  formatBalancedEquation,
} from './balance.js';

describe('parseEquation', () => {
  it('parsea H2 + O2 -> H2O', () => {
    const eq = parseEquation('H2 + O2 -> H2O');
    expect(eq.reactants).toHaveLength(2);
    expect(eq.products).toHaveLength(1);
  });

  it('ignora estados físicos', () => {
    const eq = parseEquation('H2(g) + O2(g) -> H2O(l)');
    expect(eq.reactants[0].state).toBe('g');
  });
});

describe('balanceEquation', () => {
  it('balancea H2 + O2 -> H2O', () => {
    const b = balanceEquation('H2 + O2 -> H2O');
    expect(coefficientsAreEquivalent(b.coefficients, [2, 1, 2])).toBe(true);
  });

  it('balancea Fe + O2 -> Fe2O3', () => {
    const b = balanceEquation('Fe + O2 -> Fe2O3');
    expect(coefficientsAreEquivalent(b.coefficients, [4, 3, 2])).toBe(true);
  });

  it('balancea C3H8 + O2 -> CO2 + H2O', () => {
    const b = balanceEquation('C3H8 + O2 -> CO2 + H2O');
    expect(coefficientsAreEquivalent(b.coefficients, [1, 5, 3, 4])).toBe(true);
  });

  it('balancea Al + HCl -> AlCl3 + H2', () => {
    const b = balanceEquation('Al + HCl -> AlCl3 + H2');
    expect(coefficientsAreEquivalent(b.coefficients, [2, 6, 2, 3])).toBe(true);
  });

  it('balancea CH4 + O2 -> CO2 + H2O', () => {
    const b = balanceEquation('CH4 + O2 -> CO2 + H2O');
    expect(coefficientsAreEquivalent(b.coefficients, [1, 2, 1, 2])).toBe(true);
  });

  it('formatea ecuación balanceada', () => {
    const b = balanceEquation('H2 + O2 -> H2O');
    expect(formatBalancedEquation(b)).toBe('2H2 + O2 -> 2H2O');
  });

  it('rechaza ecuación sin flecha', () => {
    expect(() => balanceEquation('H2 O2')).toThrow();
  });

  it('rechaza entrada imposible de balancear en enteros', () => {
    expect(() => balanceEquation('Fe -> FeO')).toThrow(ChemistryBalanceError);
  });
});

describe('coefficientsAreEquivalent', () => {
  it('acepta múltiplos escalares', () => {
    expect(coefficientsAreEquivalent([2, 1, 2], [4, 2, 4])).toBe(true);
  });

  it('rechaza vectores distintos', () => {
    expect(coefficientsAreEquivalent([2, 1, 2], [1, 1, 1])).toBe(false);
  });
});
