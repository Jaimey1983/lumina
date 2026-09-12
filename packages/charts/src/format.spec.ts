import { describe, expect, it } from 'vitest';
import {
  formatChartValue,
  formatCurrency,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatScale0a5,
} from './format.js';

describe('formatInteger', () => {
  it('sin decimales, con separador de miles es-CO', () => {
    expect(formatInteger(1234)).toBe('1.234');
  });
});

describe('formatDecimal', () => {
  it('1 decimal por defecto', () => {
    expect(formatDecimal(4.5)).toBe('4,5');
  });

  it('decimales configurables', () => {
    expect(formatDecimal(4.567, 2)).toBe('4,57');
  });
});

describe('formatPercent', () => {
  it('interpreta la entrada como fracción de 1', () => {
    expect(formatPercent(0.42)).toBe('42%');
  });

  it('soporta decimales', () => {
    expect(formatPercent(0.4256, 1)).toBe('42,6%');
  });
});

describe('formatCurrency', () => {
  it('COP sin decimales', () => {
    const out = formatCurrency(50000);
    expect(out).toContain('50.000');
    expect(out).not.toMatch(/,00$/);
  });
});

describe('formatScale0a5', () => {
  it('redondea a 1 decimal', () => {
    expect(formatScale0a5(4.567)).toBe('4,6');
  });

  it('no excede 1 decimal aunque el input tenga más precisión', () => {
    expect(formatScale0a5(3.14159)).toBe('3,1');
  });
});

describe('formatChartValue', () => {
  it('despacha por formato, con "decimal" por defecto', () => {
    expect(formatChartValue(4.5)).toBe(formatDecimal(4.5));
    expect(formatChartValue(0.42, 'porcentaje')).toBe(formatPercent(0.42));
    expect(formatChartValue(3, 'entero')).toBe(formatInteger(3));
    expect(formatChartValue(4.567, 'escala0a5')).toBe(formatScale0a5(4.567));
  });
});
