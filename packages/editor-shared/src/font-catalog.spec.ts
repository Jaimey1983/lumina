import { describe, expect, it } from 'vitest';

import {
  allGoogleFontFamilies,
  buildGoogleFontsUrl,
  collectFontFamiliesFromValue,
  FONT_DEFAULT,
  fontFamilyWithFallback,
  resolveFontFamily,
} from './font-catalog.js';

describe('buildGoogleFontsUrl', () => {
  it('omite fuentes de sistema y Plus Jakarta', () => {
    const url = buildGoogleFontsUrl(['Georgia', 'Arial', FONT_DEFAULT, 'Nunito']);
    expect(url).toContain('Nunito');
    expect(url).not.toContain('Georgia');
    expect(url).not.toContain('Plus+Jakarta');
  });

  it('pide un solo peso en display de un peso', () => {
    const url = buildGoogleFontsUrl(['Bebas Neue']);
    expect(url).toContain('Bebas+Neue:wght@400');
    expect(url).not.toContain('Bebas+Neue:wght@400;500;700');
  });

  it('pide 400/500/700 en sans de texto', () => {
    expect(buildGoogleFontsUrl(['Inter'])).toContain('Inter:wght@400;500;700');
  });

  it('devuelve null si no hay nada que cargar', () => {
    expect(buildGoogleFontsUrl(['Georgia', FONT_DEFAULT])).toBeNull();
  });

  it('el catálogo completo no incluye sistema', () => {
    const all = allGoogleFontFamilies();
    expect(all).not.toContain('Georgia');
    expect(all).not.toContain(FONT_DEFAULT);
    expect(all).toContain('Caveat');
  });
});

describe('collectFontFamiliesFromValue', () => {
  it('recolecta fuente de bloques y fontFamily de widgets', () => {
    const families = collectFontFamiliesFromValue({
      bloques: [
        { tipo: 'texto', fuente: 'Lora' },
        {
          tipo: 'flip-cards',
          estilosHeader: { tituloWidget: { fontFamily: 'Caveat' } },
        },
      ],
      tema: { fuente: 'Georgia, serif' },
    });
    expect(families).toEqual(expect.arrayContaining(['Lora', 'Caveat', 'Georgia']));
  });

  it('resuelve stacks legacy', () => {
    expect(collectFontFamiliesFromValue({ fontFamily: 'Arial, Helvetica, sans-serif' })).toEqual([
      'Arial',
    ]);
  });
});

describe('resolveFontFamily', () => {
  it('cae al default si está vacío', () => {
    expect(resolveFontFamily('')).toBe(FONT_DEFAULT);
  });
});

describe('fontFamilyWithFallback', () => {
  it('añade el stack por categoría', () => {
    expect(fontFamilyWithFallback('Merriweather')).toBe('Merriweather, serif');
    expect(fontFamilyWithFallback('JetBrains Mono')).toBe('"JetBrains Mono", monospace');
    expect(fontFamilyWithFallback('Caveat')).toBe('Caveat, cursive');
  });
  it('entrecomilla familias con espacios', () => {
    expect(fontFamilyWithFallback('Playfair Display')).toBe('"Playfair Display", serif');
  });
  it('display cae a sans-serif', () => {
    expect(fontFamilyWithFallback('Bebas Neue')).toBe('"Bebas Neue", sans-serif');
  });
  it('vacío → default con su stack', () => {
    expect(fontFamilyWithFallback('')).toBe(`"${FONT_DEFAULT}", sans-serif`);
  });
});
