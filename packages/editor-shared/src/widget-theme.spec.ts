import { describe, expect, it } from 'vitest';
import type { SlideTheme } from '@lumina/types/slide';
import {
  createWidgetThemeVars,
  resolveWidgetThemeTokens,
  widgetChromeVarsStyle,
} from './widget-container-styles.js';

describe('createWidgetThemeVars', () => {
  it('genera tokens semánticos por defecto cuando no se proporcionan opciones', () => {
    const vars = createWidgetThemeVars() as Record<string, string>;

    expect(vars['--lw-color-primary']).toBe('#2563eb');
    expect(vars['--lw-color-bg']).toBe('#ffffff');
    expect(vars['--lw-color-text']).toBe('#0f172a');
    expect(vars['--lw-radius-sm']).toBe('0.25rem');
    expect(vars['--lw-radius-full']).toBe('9999px');
    expect(vars['--widget-accent']).toBe('#2563eb');
    expect(vars['--widget-border']).toBe('#e2e8f0');
  });

  it('respeta las opciones de color y tipografía especificadas', () => {
    const vars = createWidgetThemeVars({
      accent: '#10b981',
      bg: '#0f172a',
      text: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
    }) as Record<string, string>;

    expect(vars['--lw-color-primary']).toBe('#10b981');
    expect(vars['--lw-color-bg']).toBe('#0f172a');
    expect(vars['--lw-color-text']).toBe('#f8fafc');
    expect(vars['--lw-font-family']).toBe('Inter, sans-serif');
    expect(vars['--widget-accent']).toBe('#10b981');
  });

  it('widgetChromeVarsStyle mantiene compatibilidad con la firma anterior', () => {
    const vars = widgetChromeVarsStyle({
      accent: '#dc2626',
      nav: '#1e293b',
    }) as Record<string, string>;

    expect(vars['--widget-accent']).toBe('#dc2626');
    expect(vars['--widget-nav']).toBe('#1e293b');
    expect(vars['--lw-color-primary']).toBe('#dc2626');
    expect(vars['--lw-color-nav']).toBe('#1e293b');
  });
});

describe('resolveWidgetThemeTokens', () => {
  const temaMock: SlideTheme = {
    id: 'tema-1',
    nombre: 'Educación Moderna',
    esPersonalizado: false,
    fondo: { tipo: 'color', valor: '#f0fdf4' },
    fuente: 'Poppins, sans-serif',
    colores: {
      acento: '#16a34a',
      texto: '#14532d',
      textoSecundario: '#4ade80',
      fondo: '#f0fdf4',
    },
  };

  it('hereda automáticamente los colores y fuente del SlideTheme', () => {
    const { colors, style } = resolveWidgetThemeTokens(temaMock);

    expect(colors.primary).toBe('#16a34a');
    expect(colors.text).toBe('#14532d');
    expect(colors.bg).toBe('#f0fdf4');
    expect(colors.textMuted).toBe('#4ade80');

    const cssVars = style as Record<string, string>;
    expect(cssVars['--lw-color-primary']).toBe('#16a34a');
    expect(cssVars['--lw-font-family']).toBe('Poppins, sans-serif');
  });

  it('permite sobrescribir colores individuales manteniendo el resto del tema', () => {
    const { colors, style } = resolveWidgetThemeTokens(temaMock, {
      accent: '#9333ea',
    });

    expect(colors.primary).toBe('#9333ea');
    expect(colors.text).toBe('#14532d'); // Heredado del tema
    expect(colors.bg).toBe('#f0fdf4'); // Heredado del tema

    const cssVars = style as Record<string, string>;
    expect(cssVars['--lw-color-primary']).toBe('#9333ea');
    expect(cssVars['--lw-color-text']).toBe('#14532d');
  });

  it('funciona correctamente sin SlideTheme (fallback limpio a valores por defecto)', () => {
    const { colors, style } = resolveWidgetThemeTokens(null);

    expect(colors.primary).toBe('#2563eb');
    expect(colors.text).toBe('#0f172a');
    expect(colors.bg).toBe('#ffffff');

    const cssVars = style as Record<string, string>;
    expect(cssVars['--lw-color-primary']).toBe('#2563eb');
    expect(cssVars['--lw-color-bg']).toBe('#ffffff');
  });
});
