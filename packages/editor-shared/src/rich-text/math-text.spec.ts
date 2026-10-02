import { describe, expect, it } from 'vitest';
import { partirTextoMatematico, tieneFormulas } from './math-text.js';

describe('partirTextoMatematico', () => {
  it('un texto sin delimitadores es un solo trozo y no se toca (paridad con lo existente)', () => {
    expect(partirTextoMatematico('¿Cuánto es 3 + 4?')).toEqual([
      { tipo: 'texto', valor: '¿Cuánto es 3 + 4?' },
    ]);
    expect(tieneFormulas('Cuesta $5 y $10')).toBe(false);
  });

  it('separa texto y fórmulas', () => {
    expect(partirTextoMatematico('¿Cuánto es \\(\\frac{1}{2}+\\frac{1}{4}\\)?')).toEqual([
      { tipo: 'texto', valor: '¿Cuánto es ' },
      { tipo: 'mate', valor: '\\frac{1}{2}+\\frac{1}{4}' },
      { tipo: 'texto', valor: '?' },
    ]);
  });

  it('admite varias fórmulas y una fórmula sola', () => {
    expect(partirTextoMatematico('\\(x\\) y \\(y\\)')).toEqual([
      { tipo: 'mate', valor: 'x' },
      { tipo: 'texto', valor: ' y ' },
      { tipo: 'mate', valor: 'y' },
    ]);
    expect(partirTextoMatematico('\\(2^{3}\\)')).toEqual([{ tipo: 'mate', valor: '2^{3}' }]);
  });

  it('un delimitador sin cerrar queda como texto y las fórmulas se acotan', () => {
    expect(partirTextoMatematico('abre \\(sin cerrar')).toEqual([
      { tipo: 'texto', valor: 'abre \\(sin cerrar' },
    ]);
    const muchas = Array.from({ length: 30 }, () => '\\(x\\)').join(' ');
    expect(partirTextoMatematico(muchas).filter((t) => t.tipo === 'mate')).toHaveLength(20);
  });
});
