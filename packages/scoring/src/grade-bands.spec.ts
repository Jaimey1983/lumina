import { describe, expect, it } from 'vitest';
import {
  NOTA_COLOMBIANA_BANDAS,
  clasificarNotaColombiana,
  obtenerBandaNotaColombiana,
} from './grade-bands.js';

describe('clasificarNotaColombiana', () => {
  it('null/undefined → null (sin nota, no una banda por defecto)', () => {
    expect(clasificarNotaColombiana(null)).toBeNull();
    expect(clasificarNotaColombiana(undefined)).toBeNull();
  });

  it('paridad exacta con los umbrales que reemplaza (3.0/4.0/4.6)', () => {
    // Antes: use-course-analytics.ts — getPerformance() / distribution
    expect(clasificarNotaColombiana(2.9)).toBe('bajo');
    expect(clasificarNotaColombiana(0)).toBe('bajo');
    expect(clasificarNotaColombiana(3.0)).toBe('basico');
    expect(clasificarNotaColombiana(3.9)).toBe('basico');
    expect(clasificarNotaColombiana(4.0)).toBe('alto');
    expect(clasificarNotaColombiana(4.6)).toBe('alto'); // original: `<= 4.6` → alto
    expect(clasificarNotaColombiana(4.7)).toBe('superior'); // original: `> 4.6` → superior
    expect(clasificarNotaColombiana(5.0)).toBe('superior');
  });

  it('degrada valores fuera de [0,5] a la banda extrema más cercana, sin devolver null', () => {
    expect(clasificarNotaColombiana(-1)).toBe('bajo');
    expect(clasificarNotaColombiana(7)).toBe('superior');
  });

  it('NaN se trata como sin nota', () => {
    expect(clasificarNotaColombiana(NaN)).toBeNull();
  });
});

describe('NOTA_COLOMBIANA_BANDAS', () => {
  it('4 bandas, en orden de menor a mayor desempeño', () => {
    expect(NOTA_COLOMBIANA_BANDAS.map((b) => b.id)).toEqual(['bajo', 'basico', 'alto', 'superior']);
  });

  it('las bandas son contiguas (el max de una es el min de la siguiente)', () => {
    for (let i = 0; i < NOTA_COLOMBIANA_BANDAS.length - 1; i++) {
      expect(NOTA_COLOMBIANA_BANDAS[i].max).toBe(NOTA_COLOMBIANA_BANDAS[i + 1].min);
    }
  });

  it('solo la última banda no tiene tope superior', () => {
    expect(NOTA_COLOMBIANA_BANDAS.slice(0, -1).every((b) => b.max !== null)).toBe(true);
    expect(NOTA_COLOMBIANA_BANDAS.at(-1)?.max).toBeNull();
  });
});

describe('obtenerBandaNotaColombiana', () => {
  it('devuelve la banda completa por id', () => {
    expect(obtenerBandaNotaColombiana('alto')).toEqual({
      id: 'alto',
      etiqueta: 'Alto',
      rangoTexto: '4.0–4.6',
      min: 4.0,
      max: 4.7,
    });
  });
});
