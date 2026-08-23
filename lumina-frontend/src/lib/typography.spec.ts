import { describe, expect, it } from 'vitest';

import type { TextBlock } from '@/types/slide.types';
import {
  applyTypographyPreset,
  isTypographySizeOnlyPatch,
  matchTypographyPreset,
  parseFontSizePx,
  textBlockPatchFromTypography,
  typographyFromTextBlock,
  typographyFromWidget,
  typographyToCss,
  widgetPatchFromTypography,
} from './typography';

describe('parseFontSizePx', () => {
  it('convierte rem a px', () => {
    expect(parseFontSizePx('1.125rem')).toBe(18);
  });

  it('lee px enteros', () => {
    expect(parseFontSizePx('24px')).toBe(24);
  });

  it('usa fallback si está vacío', () => {
    expect(parseFontSizePx(undefined, 16)).toBe(16);
  });
});

describe('adaptadores TextBlock', () => {
  const block: TextBlock = {
    tipo: 'texto',
    contenido: 'Hola',
    fuente: 'Nunito',
    tamanoFuente: '20px',
    negrita: true,
    cursiva: false,
    subrayado: true,
    alineacion: 'centro',
    interlineado: 1.5,
    espaciadoLetras: 1,
    color: '#111827',
  };

  it('lee el bloque al modelo canónico', () => {
    expect(typographyFromTextBlock(block)).toMatchObject({
      fontFamily: 'Nunito',
      fontSize: 20,
      color: '#111827',
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: true,
      lineHeight: 1.5,
      letterSpacing: 1,
      align: 'center',
    });
  });

  it('escribe un patch de vuelta al bloque', () => {
    expect(
      textBlockPatchFromTypography({
        fontFamily: 'Lora',
        fontSize: 32,
        fontWeight: 'normal',
        align: 'justify',
        lineHeight: 1.4,
      }),
    ).toEqual({
      fuente: 'Lora',
      tamanoFuente: '32px',
      negrita: false,
      alineacion: 'justificado',
      interlineado: 1.4,
    });
  });
});

describe('adaptadores widget', () => {
  it('redondea el viaje de ida y vuelta', () => {
    const style = {
      fontFamily: 'Poppins',
      fontSize: 14,
      align: 'justify' as const,
      underline: true,
      lineHeight: 1.2,
    };
    const patch = widgetPatchFromTypography(typographyFromWidget(style));
    expect(patch).toMatchObject(style);
  });
});

describe('isTypographySizeOnlyPatch', () => {
  it('detecta un cambio solo de tamaño', () => {
    expect(isTypographySizeOnlyPatch({ fontSize: 18 })).toBe(true);
    expect(isTypographySizeOnlyPatch({ fontSize: 18, color: '#000' })).toBe(false);
  });
});

describe('efectos Fase 3', () => {
  it('mapea transformación, opacidad y lista al bloque', () => {
    expect(
      textBlockPatchFromTypography({
        textTransform: 'uppercase',
        opacity: 80,
        shadow: 3,
        backgroundColor: '#FEF3C7',
        backgroundRadius: 8,
        list: 'disc',
      }),
    ).toEqual({
      transformacion: 'mayusculas',
      opacidad: 80,
      sombra: 3,
      fondoTexto: '#FEF3C7',
      radioFondo: 8,
      lista: 'vinetas',
    });
  });

  it('limpia el fondo cuando el color viene vacío', () => {
    expect(textBlockPatchFromTypography({ backgroundColor: '' })).toEqual({
      fondoTexto: undefined,
    });
  });

  it('genera CSS de sombra y fondo', () => {
    const css = typographyToCss({
      shadow: 4,
      backgroundColor: '#FEF3C7',
      backgroundRadius: 8,
      opacity: 90,
      textTransform: 'uppercase',
    });
    expect(css.textTransform).toBe('uppercase');
    expect(css.opacity).toBe(0.9);
    expect(css.textShadow).toContain('4px');
    expect(css.backgroundColor).toBe('#FEF3C7');
    expect(css.borderRadius).toBe('8px');
  });
});

describe('presets tipográficos', () => {
  it('ajusta el tamaño al máximo del inspector', () => {
    const preset = applyTypographyPreset('titulo', 10, 24);
    expect(preset.fontSize).toBe(24);
    expect(preset.fontWeight).toBe('bold');
  });

  it('reconoce un estilo que coincide con Cuerpo', () => {
    const cuerpo = applyTypographyPreset('cuerpo', 10, 48);
    expect(matchTypographyPreset(cuerpo, 10, 48)).toBe('cuerpo');
  });

  it('no marca preset si solo coincide el tamaño', () => {
    expect(
      matchTypographyPreset({ fontSize: 18, fontWeight: 'bold', lineHeight: 1.45 }, 10, 48),
    ).toBeNull();
  });
});
