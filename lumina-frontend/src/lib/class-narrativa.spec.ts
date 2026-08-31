import { describe, expect, it } from 'vitest';
import {
  hasNarrativaConfigurada,
  normalizeClassNarrativeMeta,
} from './class-narrativa';

describe('class-narrativa (Capa 10)', () => {
  it('retorna null cuando no hay datos o están vacíos', () => {
    expect(normalizeClassNarrativeMeta(null)).toBeNull();
    expect(normalizeClassNarrativeMeta(undefined)).toBeNull();
    expect(normalizeClassNarrativeMeta({})).toBeNull();
    expect(normalizeClassNarrativeMeta({ nombreMision: '   ' })).toBeNull();
    expect(
      normalizeClassNarrativeMeta({
        nombreMision: '',
        fragmentosHistoria: ['', '   '],
      }),
    ).toBeNull();
    expect(hasNarrativaConfigurada(null)).toBe(false);
    expect(hasNarrativaConfigurada({})).toBe(false);
  });

  it('normaliza y preserva nombreMision y fragmentosHistoria limpios', () => {
    const raw = {
      nombreMision: '  Misión Apolo 11  ',
      fragmentosHistoria: [
        '  El cohete despega hacia la Luna. ',
        '',
        '   El módulo aterriza con éxito.  ',
      ],
    };

    const normalized = normalizeClassNarrativeMeta(raw);
    expect(normalized).toEqual({
      nombreMision: 'Misión Apolo 11',
      fragmentosHistoria: [
        'El cohete despega hacia la Luna.',
        'El módulo aterriza con éxito.',
      ],
    });
    expect(hasNarrativaConfigurada(raw)).toBe(true);
  });

  it('permite solo nombreMision o solo fragmentosHistoria', () => {
    const soloMision = normalizeClassNarrativeMeta({
      nombreMision: 'Búsqueda del Tesoro',
    });
    expect(soloMision).toEqual({ nombreMision: 'Búsqueda del Tesoro' });

    const soloHistoria = normalizeClassNarrativeMeta({
      fragmentosHistoria: ['Capítulo 1'],
    });
    expect(soloHistoria).toEqual({ fragmentosHistoria: ['Capítulo 1'] });
  });
});
