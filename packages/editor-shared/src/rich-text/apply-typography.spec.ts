import { describe, expect, it } from 'vitest';
import { splitTypographyPatch, RANGE_TYPOGRAPHY_KEYS } from './apply-typography.js';

describe('splitTypographyPatch', () => {
  it('separa marcas de rango de propiedades de bloque', () => {
    const { range, block } = splitTypographyPatch({
      fontFamily: 'Lora',
      fontSize: 20,
      color: '#111',
      align: 'center',
      lineHeight: 1.6,
      textTransform: 'uppercase',
      opacity: 80,
      list: 'disc',
    });
    expect(range).toEqual({ fontFamily: 'Lora', fontSize: 20, color: '#111', align: 'center' });
    expect(block).toEqual({ lineHeight: 1.6, textTransform: 'uppercase', opacity: 80, list: 'disc' });
  });

  it('las claves de rango incluyen peso, itálica y subrayado', () => {
    for (const k of ['fontWeight', 'fontStyle', 'underline', 'letterSpacing'] as const) {
      expect(RANGE_TYPOGRAPHY_KEYS.has(k)).toBe(true);
    }
    expect(RANGE_TYPOGRAPHY_KEYS.has('shadow')).toBe(false);
  });

  it('un patch sólo de bloque deja range vacío', () => {
    const { range, block } = splitTypographyPatch({ lineHeight: 1.2 });
    expect(range).toEqual({});
    expect(block).toEqual({ lineHeight: 1.2 });
  });
});
