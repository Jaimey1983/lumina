import { describe, expect, it } from 'vitest';
import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  contrastVerdict,
  isLargeText,
  backgroundColorForContrast,
} from './contrast.js';

describe('parseColor', () => {
  it('hex de 6', () => expect(parseColor('#ffffff')).toEqual([255, 255, 255]));
  it('hex de 3', () => expect(parseColor('#000')).toEqual([0, 0, 0]));
  it('rgb()', () => expect(parseColor('rgb(37, 99, 235)')).toEqual([37, 99, 235]));
  it('rgba()', () => expect(parseColor('rgba(0,0,0,0.5)')).toEqual([0, 0, 0]));
  it('inválido → null', () => expect(parseColor('rebeccapurple')).toBeNull());
  it('undefined → null', () => expect(parseColor(undefined)).toBeNull());
});

describe('relativeLuminance', () => {
  it('negro = 0, blanco = 1', () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('blanco sobre negro = 21', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
  });
  it('mismo color = 1', () => {
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('color no parseable → null', () => {
    expect(contrastRatio('nope', '#fff')).toBeNull();
  });
});

describe('isLargeText', () => {
  it('≥24px es grande', () => expect(isLargeText(24, false)).toBe(true));
  it('≥19px en negrita es grande', () => expect(isLargeText(19, true)).toBe(true));
  it('18px normal no es grande', () => expect(isLargeText(18, false)).toBe(false));
});

describe('contrastVerdict', () => {
  it('texto normal gris claro sobre blanco no pasa (umbral 4.5)', () => {
    const v = contrastVerdict('#9ca3af', '#ffffff', 16, false)!;
    expect(v.umbral).toBe(4.5);
    expect(v.passes).toBe(false);
  });
  it('texto grande negro sobre blanco pasa (umbral 3)', () => {
    const v = contrastVerdict('#000000', '#ffffff', 40, false)!;
    expect(v.umbral).toBe(3);
    expect(v.passes).toBe(true);
  });
  it('sin fondo parseable → null', () => {
    expect(contrastVerdict('#000', undefined, 16, false)).toBeNull();
  });
});

describe('backgroundColorForContrast', () => {
  it('fondo de color', () => {
    expect(backgroundColorForContrast({ tipo: 'color', valor: '#123456' })).toBe('#123456');
  });
  it('gradiente por stops', () => {
    expect(
      backgroundColorForContrast({
        tipo: 'gradiente',
        stops: [
          { color: '#abcdef', position: 0 },
          { color: '#000000', position: 100 },
        ],
      }),
    ).toBe('#abcdef');
  });
  it('gradiente legado por inicio', () => {
    expect(
      backgroundColorForContrast({ tipo: 'gradiente', inicio: '#fedcba', fin: '#000' }),
    ).toBe('#fedcba');
  });
  it('imagen → undefined', () => {
    expect(backgroundColorForContrast({ tipo: 'imagen', url: 'x' })).toBeUndefined();
  });
  it('null → undefined', () => {
    expect(backgroundColorForContrast(null)).toBeUndefined();
  });
});
