import { describe, expect, it } from 'vitest';
import {
  resolveBuiltinToken,
  makeTokenResolver,
  interpolateTokens,
  hasTokens,
  textTokenExtra,
} from './text-tokens.js';

const now = new Date('2026-09-09T14:30:00');

describe('resolveBuiltinToken', () => {
  it('fecha / hora', () => {
    expect(resolveBuiltinToken('fecha', { now })).toMatch(/9.*2026|2026.*9/);
    expect(resolveBuiltinToken('hora', { now })).toMatch(/\d{1,2}:\d{2}/);
  });
  it('n_slide / total_slides sólo con slideCount > 0', () => {
    expect(resolveBuiltinToken('n_slide', { slideIndex: 2, slideCount: 7 })).toBe('3');
    expect(resolveBuiltinToken('total_slides', { slideIndex: 2, slideCount: 7 })).toBe('7');
    expect(resolveBuiltinToken('n_slide', { slideIndex: 0, slideCount: 0 })).toBeUndefined();
  });
  it('token desconocido → undefined', () => {
    expect(resolveBuiltinToken('docente')).toBeUndefined();
  });
});

describe('makeTokenResolver', () => {
  it('extra tiene prioridad sobre built-in', () => {
    const r = makeTokenResolver({ now }, { docente: 'Ana Ruiz', fecha: 'IGNORADO?' });
    expect(r('docente')).toBe('Ana Ruiz');
    // `fecha` de extra también gana (es un override explícito)
    expect(r('fecha')).toBe('IGNORADO?');
  });
  it('extra vacío no pisa built-in', () => {
    const r = makeTokenResolver({ slideCount: 3, slideIndex: 0 }, { n_slide: '' });
    expect(r('n_slide')).toBe('1');
  });
});

describe('textTokenExtra', () => {
  it('mapea clase / codigoClase / docente a las claves de token', () => {
    expect(textTokenExtra({ clase: 'Historia', codigoClase: 'ab12', docente: 'Ana' })).toEqual({
      clase: 'Historia',
      codigo_clase: 'ab12',
      docente: 'Ana',
    });
  });
  it('omite claves vacías / ausentes y devuelve undefined si no queda ninguna', () => {
    expect(textTokenExtra({ clase: '  ', codigoClase: null })).toBeUndefined();
    expect(textTokenExtra({ clase: 'X' })).toEqual({ clase: 'X' });
  });
  it('recorta espacios', () => {
    expect(textTokenExtra({ codigoClase: '  K9  ' })).toEqual({ codigo_clase: 'K9' });
  });
});

describe('interpolateTokens', () => {
  const r = makeTokenResolver({ now, slideIndex: 1, slideCount: 5 }, { docente: 'Ana' });
  it('sustituye lo reconocido, deja lo desconocido', () => {
    expect(interpolateTokens('Hola {{docente}}, slide {{n_slide}}/{{total_slides}} · {{x}}', r)).toBe(
      'Hola Ana, slide 2/5 · {{x}}',
    );
  });
  it('texto sin tokens vuelve idéntico', () => {
    expect(interpolateTokens('sin tokens aquí', r)).toBe('sin tokens aquí');
  });
  it('hasTokens', () => {
    expect(hasTokens('a {{b}} c')).toBe(true);
    expect(hasTokens('a { b } c')).toBe(false);
  });
});
