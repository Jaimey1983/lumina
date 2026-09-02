import { describe, expect, it } from 'vitest';
import type { Font, PathCommand } from 'opentype.js';

import {
  commandsToObjectBoundingBoxD,
  fontsourceSlug,
  fontsourceTtfUrl,
  normalizeTypography,
  splitMaskLines,
  textOutlineGeometry,
  weightsForTextMask,
} from '@/lib/text-mask';

/**
 * Fuente falsa: cada carácter es un rectángulo de 0.5·size de ancho, `size` de
 * alto, colocado por su advance (0.6·size). Suficiente para comprobar la
 * aritmética de composición (multilínea, interlineado, escala).
 */
function fakeFont(): Font {
  return {
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    getAdvanceWidth: (line: string, size: number) => line.length * size * 0.6,
    getPath: (line: string, x: number, y: number, size: number) => ({
      commands: line.split('').flatMap((_, i) => {
        const px = x + i * size * 0.6;
        return [
          { type: 'M' as const, x: px, y: y - size },
          { type: 'L' as const, x: px + size * 0.5, y: y - size },
          { type: 'L' as const, x: px + size * 0.5, y },
          { type: 'L' as const, x: px, y },
          { type: 'Z' as const },
        ];
      }),
    }),
  } as unknown as Font;
}

describe('fontsourceSlug', () => {
  it('lowercases y reemplaza espacios por guiones', () => {
    expect(fontsourceSlug('Plus Jakarta Sans')).toBe('plus-jakarta-sans');
    expect(fontsourceSlug('EB Garamond')).toBe('eb-garamond');
    expect(fontsourceSlug('Source Sans 3')).toBe('source-sans-3');
  });

  it('resuelve alias del catálogo antes de generar el slug', () => {
    expect(fontsourceSlug('inter, system-ui, sans-serif')).toBe('inter');
  });
});

describe('splitMaskLines', () => {
  it('recorta a las líneas y caracteres máximos', () => {
    const long = Array.from({ length: 10 }, (_, i) => `L${i}-`.repeat(20)).join('\n');
    const lines = splitMaskLines(long);
    expect(lines).toHaveLength(6);
    expect(lines.every((l) => l.length <= 40)).toBe(true);
  });

  it('conserva líneas vacías intermedias (huecos de interlineado)', () => {
    expect(splitMaskLines('a\n\nb')).toEqual(['a', '', 'b']);
  });
});

describe('fontsourceTtfUrl', () => {
  it('apunta al .ttf de jsDelivr para familia + peso', () => {
    expect(fontsourceTtfUrl('Roboto', 700)).toBe(
      'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.ttf',
    );
  });
});

describe('weightsForTextMask', () => {
  it('devuelve pesos para familias de Google', () => {
    expect(weightsForTextMask('Inter')).toEqual([400, 500, 700]);
  });

  it('devuelve un único peso para familias de peso limitado', () => {
    expect(weightsForTextMask('Bebas Neue')).toEqual([400]);
  });

  it('devuelve lista vacía para familias de sistema (sin binario descargable)', () => {
    expect(weightsForTextMask('Arial')).toEqual([]);
    expect(weightsForTextMask('Georgia')).toEqual([]);
  });
});

describe('commandsToObjectBoundingBoxD', () => {
  it('normaliza al bbox y PRESERVA los comandos de curva (sin aplanar)', () => {
    // Cuadrado 100×100 con origen en (10, 20); una curva cúbica y una cuadrática.
    const commands: PathCommand[] = [
      { type: 'M', x: 10, y: 20 },
      { type: 'C', x1: 60, y1: 20, x2: 110, y2: 70, x: 110, y: 120 },
      { type: 'Q', x1: 10, y1: 120, x: 10, y: 20 },
      { type: 'Z' },
    ];
    const d = commandsToObjectBoundingBoxD(commands, { x1: 10, y1: 20, x2: 110, y2: 120 });

    // Un comando por tramo: nada de una ristra de L cortos aproximando la curva.
    expect(d).toBe('M0,0 C0.5,0 1,0.5 1,1 Q0,1 0,0 Z');
    expect((d.match(/C/g) ?? []).length).toBe(1);
    expect((d.match(/Q/g) ?? []).length).toBe(1);
    expect(d).not.toContain('L');
  });

  it('mantiene múltiples subpaths (una letra con hueco → M…Z M…Z)', () => {
    const commands: PathCommand[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'Z' },
      { type: 'M', x: 2, y: 2 },
      { type: 'L', x: 8, y: 2 },
      { type: 'L', x: 8, y: 8 },
      { type: 'Z' },
    ];
    const d = commandsToObjectBoundingBoxD(commands, { x1: 0, y1: 0, x2: 10, y2: 10 });
    expect((d.match(/M/g) ?? []).length).toBe(2);
    expect((d.match(/Z/g) ?? []).length).toBe(2);
  });

  it('devuelve cadena vacía si el bbox es degenerado', () => {
    expect(
      commandsToObjectBoundingBoxD([{ type: 'M', x: 0, y: 0 }], { x1: 0, y1: 0, x2: 0, y2: 10 }),
    ).toBe('');
  });

  const box = { x1: 0, y1: 0, x2: 10, y2: 10 };
  const square: PathCommand[] = [
    { type: 'M', x: 0, y: 0 },
    { type: 'L', x: 10, y: 10 },
    { type: 'Q', x1: 0, y1: 10, x: 5, y: 5 },
    { type: 'Z' },
  ];

  it('fill < 1 encoge el contorno hacia el centro (0.5) sin tocar los comandos', () => {
    const d = commandsToObjectBoundingBoxD(square, box, 0.5);
    // (0,0) → 0.25 ; (10,10) → 0.75 ; centro (5,5) → 0.5
    expect(d).toBe('M0.25,0.25 L0.75,0.75 Q0.25,0.75 0.5,0.5 Z');
  });

  it('fill = 0 colapsa todo el contorno al centro (máscara vacía)', () => {
    const d = commandsToObjectBoundingBoxD(square, box, 0);
    expect(d).toBe('M0.5,0.5 L0.5,0.5 Q0.5,0.5 0.5,0.5 Z');
  });

  it('fill > 1 hace sobresalir el contorno de [0,1] (el recuadro lo recorta)', () => {
    const d = commandsToObjectBoundingBoxD(square, box, 2);
    // (0,0) → -0.5 ; (10,10) → 1.5
    expect(d).toBe('M-0.5,-0.5 L1.5,1.5 Q-0.5,1.5 0.5,0.5 Z');
  });
});

describe('normalizeTypography', () => {
  it('rellena defaults neutros', () => {
    expect(normalizeTypography()).toEqual({
      fontScale: 1,
      letterSpacing: 0,
      lineHeight: 1,
      scaleX: 1,
      scaleY: 1,
      align: 'center',
    });
  });

  it('acota valores fuera de rango y descarta align inválido', () => {
    const t = normalizeTypography({
      fontScale: 99,
      letterSpacing: 99,
      lineHeight: -5,
      scaleX: 0,
      scaleY: 100,
      align: 'justify' as never,
    });
    expect(t.fontScale).toBe(3);
    expect(normalizeTypography({ fontScale: -1 }).fontScale).toBe(0);
    expect(t.letterSpacing).toBe(0.6);
    expect(t.lineHeight).toBe(0.7);
    expect(t.scaleX).toBe(0.4);
    expect(t.scaleY).toBe(2.5);
    expect(t.align).toBe('center');
  });
});

describe('textOutlineGeometry (composición)', () => {
  it('una línea: aspect = ancho/alto del contorno', () => {
    // "AB": x 0..1100, y -1000..0  → aspect 1.1
    const g = textOutlineGeometry(fakeFont(), 'AB');
    expect(g?.aspect).toBeCloseTo(1.1, 5);
    expect(g?.pathData.startsWith('M')).toBe(true);
  });

  it('multilínea apila las líneas y baja el aspect', () => {
    const one = textOutlineGeometry(fakeFont(), 'A');
    const two = textOutlineGeometry(fakeFont(), 'A\nA');
    // 2 líneas con interlineado 1 → alto ~2×, aspect ~mitad.
    expect(two!.aspect).toBeCloseTo(one!.aspect / 2, 5);
    expect((two!.pathData.match(/M/g) ?? []).length).toBe(2);
  });

  it('interlineado mayor separa más las líneas (aspect menor)', () => {
    const tight = textOutlineGeometry(fakeFont(), 'A\nA', { lineHeight: 1 });
    const loose = textOutlineGeometry(fakeFont(), 'A\nA', { lineHeight: 2 });
    expect(loose!.aspect).toBeLessThan(tight!.aspect);
  });

  it('alto de letra (scaleY) estira en vertical y reduce el aspect', () => {
    const base = textOutlineGeometry(fakeFont(), 'A', { scaleY: 1 });
    const tall = textOutlineGeometry(fakeFont(), 'A', { scaleY: 2 });
    expect(tall!.aspect).toBeCloseTo(base!.aspect / 2, 5);
  });

  it('ancho de letra (scaleX) estira en horizontal y sube el aspect', () => {
    const base = textOutlineGeometry(fakeFont(), 'A', { scaleX: 1 });
    const wide = textOutlineGeometry(fakeFont(), 'A', { scaleX: 2 });
    expect(wide!.aspect).toBeCloseTo(base!.aspect * 2, 5);
  });

  it('tamaño de letra (fontScale) NO cambia el aspect pero encoge el contorno', () => {
    const full = textOutlineGeometry(fakeFont(), 'AB', { fontScale: 1 });
    const small = textOutlineGeometry(fakeFont(), 'AB', { fontScale: 0.5 });
    expect(small!.aspect).toBeCloseTo(full!.aspect, 5); // el recuadro/bloque no cambia
    // el primer punto pasa de un borde (0 o 1) a estar a medio camino del centro.
    const firstFull = Number(full!.pathData.match(/^M([-\d.]+),/)![1]);
    const firstSmall = Number(small!.pathData.match(/^M([-\d.]+),/)![1]);
    expect(Math.abs(firstSmall - 0.5)).toBeLessThan(Math.abs(firstFull - 0.5));
  });

  it('solo espacios → null', () => {
    expect(textOutlineGeometry(fakeFont(), '   \n  ')).toBeNull();
  });
});
