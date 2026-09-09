import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import {
  hexWithOpacity,
  textBlockBoxCss,
  textBlockColumnsCss,
  textBoxValueFromBlock,
  applyTextBoxPatch,
} from './text-box.js';

const base: TextBlock = { tipo: 'texto', contenido: 'x' };

describe('hexWithOpacity', () => {
  it('hex + % → rgba', () => {
    expect(hexWithOpacity('#facc15', 35)).toBe('rgba(250, 204, 21, 0.35)');
  });
  it('no-hex pasa igual', () => {
    expect(hexWithOpacity('rgb(1,2,3)', 50)).toBe('rgb(1,2,3)');
  });
});

describe('textBlockBoxCss', () => {
  it('sin props de caja → null', () => {
    expect(textBlockBoxCss(base)).toBeNull();
  });
  it('relleno + borde + sombra + alineación vertical', () => {
    const css = textBlockBoxCss({
      ...base,
      relleno: 20,
      alineacionVertical: 'centro',
      borde: { color: '#2563eb', grosor: 3, radio: 12 },
      sombraCaja: { desenfoque: 18, y: 8 },
    })!;
    expect(css.padding).toBe('20px');
    expect(css.border).toBe('3px solid #2563eb');
    expect(css.borderRadius).toBe('12px');
    expect(css.display).toBe('flex');
    expect(css.justifyContent).toBe('center');
    expect(String(css.boxShadow)).toContain('18px');
  });
});

describe('textBlockColumnsCss', () => {
  it('columnas ≥ 2 → column-count + gap', () => {
    expect(textBlockColumnsCss({ ...base, columnas: 2, columnasBrecha: 16 })).toMatchObject({
      columnCount: 2,
      columnGap: '16px',
    });
  });
  it('columnas 1 → nada', () => {
    expect(textBlockColumnsCss({ ...base, columnas: 1 })).toEqual({});
  });
  it('medidaMax → max-width en ch', () => {
    expect(textBlockColumnsCss({ ...base, medidaMax: 60 }).maxWidth).toBe('60ch');
  });
});

describe('textBoxValueFromBlock / applyTextBoxPatch', () => {
  it('round-trip de borde y sombra (objetos anidados)', () => {
    const b: TextBlock = {
      ...base,
      borde: { color: '#111', grosor: 2 },
      sombraCaja: { desenfoque: 10 },
    };
    const v = textBoxValueFromBlock(b);
    expect(v.bordeColor).toBe('#111');
    expect(v.sombraDesenfoque).toBe(10);

    const patched = applyTextBoxPatch(b, { bordeRadio: 6 });
    expect(patched.borde).toEqual({ color: '#111', grosor: 2, radio: 6 });
    // la sombra no se toca
    expect(patched.sombraCaja).toEqual({ desenfoque: 10 });
  });
  it('patch de columnas 1 → columnas = undefined', () => {
    expect(applyTextBoxPatch({ ...base, columnas: 3 }, { columnas: undefined }).columnas).toBeUndefined();
  });
});
