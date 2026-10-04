import { describe, expect, it } from 'vitest';
import { ChemistryParseError } from '../errors.js';
import { normalizeFormulaInput } from './normalize.js';
import { parseFormula, MAX_FORMULA_LENGTH } from './parse.js';

describe('normalizeFormulaInput', () => {
  it('convierte subíndices Unicode', () => {
    expect(normalizeFormulaInput('H₂SO₄')).toBe('H2SO4');
  });
});

describe('parseFormula', () => {
  it('parsea H2O', () => {
    expect(parseFormula('H2O').atoms).toEqual({ H: 2, O: 1 });
  });

  it('parsea H2SO4', () => {
    expect(parseFormula('H2SO4').atoms).toEqual({ H: 2, S: 1, O: 4 });
  });

  it('parsea Ca(OH)2', () => {
    expect(parseFormula('Ca(OH)2').atoms).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  it('parsea hidrato CuSO4·5H2O', () => {
    expect(parseFormula('CuSO4·5H2O').atoms).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it('parsea carga NH4+', () => {
    const p = parseFormula('NH4+');
    expect(p.atoms).toEqual({ N: 1, H: 4 });
    expect(p.charge).toBe(1);
  });

  it('parsea Fe2+', () => {
    expect(parseFormula('Fe2+').charge).toBe(2);
    expect(parseFormula('Fe2+').atoms).toEqual({ Fe: 1 });
  });

  it('parsea SO4^2-', () => {
    const p = parseFormula('SO4^2-');
    expect(p.atoms.O).toBe(4);
    expect(p.charge).toBe(-2);
  });

  it('no confunde H2SO4 con carga', () => {
    expect(parseFormula('H2SO4').charge).toBe(0);
  });

  it('rechaza paréntesis sin cerrar', () => {
    expect(() => parseFormula('Ca(OH')).toThrow(ChemistryParseError);
  });

  it('rechaza elemento inválido', () => {
    expect(() => parseFormula('Xx2')).toThrow(ChemistryParseError);
  });

  it('rechaza fórmula vacía', () => {
    expect(() => parseFormula('   ')).toThrow(ChemistryParseError);
  });

  it('rechaza caracteres hostiles', () => {
    expect(() => parseFormula('H2O; DROP TABLE')).toThrow(ChemistryParseError);
  });

  it('rechaza fórmula demasiado larga', () => {
    const long = 'H'.repeat(MAX_FORMULA_LENGTH + 1);
    expect(() => parseFormula(long)).toThrow(ChemistryParseError);
  });

  it('rechaza eval-like', () => {
    expect(() => parseFormula('eval(1)')).toThrow(ChemistryParseError);
  });

  it('parsea Al2(SO4)3', () => {
    expect(parseFormula('Al2(SO4)3').atoms).toEqual({ Al: 2, S: 3, O: 12 });
  });

  it('parsea hidrato con punto medio Unicode', () => {
    expect(parseFormula('Na2CO3·10H2O').atoms.H).toBe(20);
  });

  it('parsea Mg(OH)2', () => {
    expect(parseFormula('Mg(OH)2').atoms).toEqual({ Mg: 1, O: 2, H: 2 });
  });

  it('parsea Cl-', () => {
    expect(parseFormula('Cl-').charge).toBe(-1);
  });

  it('parsea (OH)-', () => {
    expect(parseFormula('(OH)-').charge).toBe(-1);
    expect(parseFormula('(OH)-').atoms.H).toBe(1);
  });
});
