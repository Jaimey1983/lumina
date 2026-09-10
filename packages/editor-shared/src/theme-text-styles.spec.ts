import { describe, expect, it } from 'vitest';
import type { SlideTheme } from '@lumina/types/slide';
import { resolveThemeTextStyle, THEME_ROLE_DEFAULTS } from './theme-text-styles.js';

const theme: SlideTheme = {
  id: 't',
  nombre: 'T',
  esPersonalizado: false,
  fondo: { tipo: 'color', valor: '#fff' },
  fuente: 'Poppins',
  colores: { texto: '#111', textoSecundario: '#777', acento: '#00f', fondo: '#fff' },
};

describe('resolveThemeTextStyle', () => {
  it('rol "titulo" sin tema → preset del rol', () => {
    const css = resolveThemeTextStyle(null, 'titulo');
    expect(css.fontSize).toBe(`${THEME_ROLE_DEFAULTS.titulo.tamanoFuente}px`);
    expect(css.fontWeight).toBe(700);
    expect(css.color).toBeUndefined();
    expect(css.fontFamily).toBeUndefined();
  });

  it('con tema: fuente y color del tema (texto para titulo/cuerpo)', () => {
    const css = resolveThemeTextStyle(theme, 'cuerpo');
    expect(String(css.fontFamily)).toContain('Poppins');
    expect(css.color).toBe('#111');
    expect(css.fontWeight).toBe(400);
  });

  it('rol "pie" usa textoSecundario', () => {
    expect(resolveThemeTextStyle(theme, 'pie').color).toBe('#777');
  });

  it('overrides de theme.tipografia[rol] ganan sobre el preset y el color del tema', () => {
    const withTypo: SlideTheme = {
      ...theme,
      tipografia: { titulo: { tamanoFuente: 60, color: '#abc', fuente: 'Inter', negrita: false } },
    };
    const css = resolveThemeTextStyle(withTypo, 'titulo');
    expect(css.fontSize).toBe('60px');
    expect(css.color).toBe('#abc');
    expect(css.fontWeight).toBe(400);
    expect(String(css.fontFamily)).toContain('Inter');
  });
});
