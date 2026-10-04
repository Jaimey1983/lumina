import { describe, expect, it } from 'vitest';

import { flattenCounts, normalizeFormulaInput, parseFormula } from './parse.js';

describe('normalizeFormulaInput', () => {
  it('convierte subíndices Unicode', () => {
    expect(normalizeFormulaInput('H₂SO₄')).toBe('H2SO4');
  });
});

describe('parseFormula', () => {
  it('H2SO4', () => {
    const p = parseFormula('H2SO4');
    expect(p).not.toBeNull();
    expect(flattenCounts(p!)).toMatchObject({ H: 2, S: 1, O: 4 });
  });

  it('Ca(OH)2', () => {
    expect(flattenCounts(parseFormula('Ca(OH)2')!)).toMatchObject({ Ca: 1, O: 2, H: 2 });
  });

  it('Fe2(SO4)3', () => {
    expect(flattenCounts(parseFormula('Fe2(SO4)3')!)).toMatchObject({ Fe: 2, S: 3, O: 12 });
  });

  it('hidrato ·5H2O', () => {
    const p = parseFormula('CuSO4·5H2O');
    expect(p).not.toBeNull();
    const c = flattenCounts(p!);
    expect(c.H).toBe(10);
    expect(c.O).toBe(9);
  });

  it('rechaza ecuación disfrazada', () => {
    expect(parseFormula('H2 + O2')).toBeNull();
    expect(parseFormula('H2+O2')).toBeNull();
  });

  it('rechaza eval', () => {
    expect(parseFormula('eval(1)')).toBeNull();
  });

  it('rechaza cadena vacía', () => {
    expect(parseFormula('')).toBeNull();
  });

  it('rechaza demasiado larga', () => {
    expect(parseFormula('C'.repeat(121))).toBeNull();
  });

  it('rechaza símbolo inválido', () => {
    expect(parseFormula('Xx2')).toBeNull();
  });

  it('rechaza flecha', () => {
    expect(parseFormula('A->B')).toBeNull();
  });
});
