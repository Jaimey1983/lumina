import { describe, expect, it } from 'vitest';
import {
  HEADING_SCALE,
  BODY_TEXT_SCALE,
  headingFallbackCss,
  effectiveFontSizePx,
  typographyPatchFromHeadingLevel,
  isDerivedHeadingSize,
} from './heading-scale.js';

describe('HEADING_SCALE', () => {
  it('cubre H1–H6 con tamaño decreciente', () => {
    const sizes = [1, 2, 3, 4, 5, 6].map((n) => HEADING_SCALE[n as 1].sizePx);
    expect(sizes).toEqual([40, 32, 26, 22, 18, 16]);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]!).toBeLessThan(sizes[i - 1]!);
    }
  });
});

describe('headingFallbackCss', () => {
  it('sin nivel devuelve {}', () => {
    expect(headingFallbackCss(undefined, {})).toEqual({});
  });

  it('nivel sin overrides aplica toda la escala', () => {
    expect(headingFallbackCss(1, {})).toEqual({
      fontSize: '40px',
      fontWeight: 700,
      letterSpacing: '-0.5px',
      lineHeight: 1.1,
    });
  });

  it('el tamaño explícito del bloque gana', () => {
    const css = headingFallbackCss(1, { tamanoFuente: '12px' });
    expect(css.fontSize).toBeUndefined();
    expect(css.fontWeight).toBe(700);
  });

  it('negrita:false desactiva el peso de la escala (deja el resto)', () => {
    const css = headingFallbackCss(2, { negrita: false });
    expect(css.fontWeight).toBeUndefined();
    expect(css.fontSize).toBe('32px');
  });

  it('interlineado y tracking explícitos ganan', () => {
    const css = headingFallbackCss(3, { interlineado: 2, espaciadoLetras: 4 });
    expect(css.lineHeight).toBeUndefined();
    expect(css.letterSpacing).toBeUndefined();
    expect(css.fontSize).toBe('26px');
  });

  it('cadena vacía cuenta como tamaño sin fijar', () => {
    expect(headingFallbackCss(1, { tamanoFuente: '' }).fontSize).toBe('40px');
  });
});

describe('effectiveFontSizePx', () => {
  it('usa el tamaño explícito si está', () => {
    expect(effectiveFontSizePx('24px', 1)).toBe(24);
  });
  it('convierte rem', () => {
    expect(effectiveFontSizePx('1.5rem', undefined)).toBe(24);
  });
  it('cae a la escala del nivel', () => {
    expect(effectiveFontSizePx(undefined, 2)).toBe(32);
    expect(effectiveFontSizePx('', 3)).toBe(26);
  });
  it('0 si no hay ni tamaño ni nivel', () => {
    expect(effectiveFontSizePx(undefined, undefined)).toBe(0);
  });
});

describe('typographyPatchFromHeadingLevel', () => {
  it('H1 → 40 / bold / 1.1 / -0.5', () => {
    expect(typographyPatchFromHeadingLevel(1)).toEqual({
      fontSize: 40,
      fontWeight: 'bold',
      lineHeight: 1.1,
      letterSpacing: -0.5,
    });
  });
  it('undefined ("P") → cuerpo', () => {
    expect(typographyPatchFromHeadingLevel(undefined)).toEqual({
      fontSize: BODY_TEXT_SCALE.sizePx,
      fontWeight: 'normal',
      lineHeight: BODY_TEXT_SCALE.lineHeight,
      letterSpacing: 0,
    });
  });
});

describe('isDerivedHeadingSize', () => {
  it('sin tamaño o NaN es derivado', () => {
    expect(isDerivedHeadingSize(undefined)).toBe(true);
    expect(isDerivedHeadingSize(Number.NaN)).toBe(true);
  });

  it('18px del cuerpo es derivado (no un override)', () => {
    expect(isDerivedHeadingSize(18)).toBe(true);
    expect(isDerivedHeadingSize(BODY_TEXT_SCALE.sizePx)).toBe(true);
  });

  it('el tamaño de la escala del nivel previo es derivado', () => {
    expect(isDerivedHeadingSize(40, 1)).toBe(true);
    expect(isDerivedHeadingSize(32, 2)).toBe(true);
  });

  it('un tamaño manual distinto de cuerpo y de la escala previa se respeta', () => {
    expect(isDerivedHeadingSize(24)).toBe(false);
    expect(isDerivedHeadingSize(55, 1)).toBe(false);
  });
});
