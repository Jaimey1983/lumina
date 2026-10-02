import { describe, expect, it } from 'vitest';
import {
  ALGEBRA_MAX_LARGO,
  expresionesEquivalentes,
  validarExpresionAlgebraica,
} from './algebra.js';

describe('expresionesEquivalentes', () => {
  it.each([
    ['2x+2', '2(x+1)'],
    ['(x-1)(x+1)', 'x^2-1'],
    ['(x+1)^2', 'x^2+2x+1'],
    ['x(x+3)', 'x^2+3x'],
    ['1/2x', 'x/2'],
    ['0,5x', 'x/2'],
    ['x²−4', '(x-2)(x+2)'],
    ['3x·2', '6x'],
    ['sqrt(x^2)', 'abs(x)'],
    ['sin(x)^2+cos(x)^2', '1'],
    ['2^-1', '0.5'],
    ['-x^2', '-(x^2)'],
    ['(x^2-1)/(x-1)', 'x+1'],
    ['x = 3', '3'],
    ['2pi', 'π+π'],
    ['ab', 'a*b'],
  ] as [string, string][])('%s ≡ %s', (a, b) => {
    expect(expresionesEquivalentes(a, b)).toBe(true);
  });

  it.each([
    ['2x+2', '2x+1'],
    ['(x+1)^2', 'x^2+1'],
    ['x^2', 'x^3'],
    ['x', 'y'],
    ['sqrt(x^2)', 'x'],
    ['ln(x^2)', '2ln(x)'],
    ['1/x', 'x'],
    ['2x', '2+x'],
    ['sin(x)', 'cos(x)'],
    ['raiz(x)*raiz(x)', 'x'], // el dominio importa: sqrt(x)² no existe para x < 0
  ] as [string, string][])('%s ≢ %s', (a, b) => {
    expect(expresionesEquivalentes(a, b)).toBe(false);
  });

  it('constantes: 3/4 ≡ 0,75 y 0,7 no', () => {
    expect(expresionesEquivalentes('3/4', '0,75')).toBe(true);
    expect(expresionesEquivalentes('3/4', '0,7')).toBe(false);
  });

  it('devuelve null si no se puede leer o no hay puntos comparables', () => {
    expect(expresionesEquivalentes('2x+', 'x')).toBeNull();
    expect(expresionesEquivalentes('x', '')).toBeNull();
    expect(expresionesEquivalentes('sqrt(-x^2-1)', 'sqrt(-x^2-1)')).toBeNull();
    expect(expresionesEquivalentes(5, 'x')).toBeNull();
  });

  it('es determinista', () => {
    const r = Array.from({ length: 5 }, () => expresionesEquivalentes('x^2-1', '(x-1)(x+1)'));
    expect(new Set(r).size).toBe(1);
  });
});

describe('validarExpresionAlgebraica', () => {
  it('acepta lo válido y explica lo inválido', () => {
    expect(validarExpresionAlgebraica('2(x+1)')).toBeNull();
    expect(validarExpresionAlgebraica('x = 3')).toBeNull();
    expect(validarExpresionAlgebraica('(x+1')).toContain('paréntesis');
    expect(validarExpresionAlgebraica('x+1)')).toContain('paréntesis');
    expect(validarExpresionAlgebraica('sin x')).toContain('paréntesis');
    expect(validarExpresionAlgebraica('2 $ 3')).toContain('Símbolo');
    expect(validarExpresionAlgebraica('')).toContain('vacía');
    expect(validarExpresionAlgebraica(null)).toContain('texto');
  });

  it('acota tamaño, anidamiento y complejidad (no cuelga ni revienta la pila)', () => {
    expect(validarExpresionAlgebraica('x+'.repeat(ALGEBRA_MAX_LARGO))).toContain('larga');
    expect(validarExpresionAlgebraica('('.repeat(70) + 'x' + ')'.repeat(70))).toContain('anidados');
    expect(validarExpresionAlgebraica('x'.repeat(190))).toContain('compleja');
  });

  it('no ejecuta código: identificadores ajenos se leen como variables de una letra', () => {
    expect(expresionesEquivalentes('alert(1)', 'x')).toBe(false);
    expect(validarExpresionAlgebraica('process.exit()')).not.toBeNull();
    expect(validarExpresionAlgebraica('constructor')).toBeNull();
  });

  it('potencias enormes no cuelgan', () => {
    const t0 = Date.now();
    expect(expresionesEquivalentes('x^99999999', 'x^99999999')).not.toBe(false);
    expect(Date.now() - t0).toBeLessThan(500);
  });
});
