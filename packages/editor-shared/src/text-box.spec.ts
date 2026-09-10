import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import {
  hexWithOpacity,
  textBlockBoxCss,
  textBlockColumnsCss,
  textBlockDecorCss,
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

describe('contorno y degradado', () => {
  it('round-trip de contorno', () => {
    const b: TextBlock = { ...base, contorno: { color: '#f00', grosor: 2 } };
    const v = textBoxValueFromBlock(b);
    expect(v.contornoColor).toBe('#f00');
    expect(v.contornoGrosor).toBe(2);
  });

  it('patch enciende contorno; grosor solo lo actualiza sin borrar el color', () => {
    const on = applyTextBoxPatch(base, { contornoColor: '#000', contornoGrosor: 1 });
    expect(on.contorno).toEqual({ color: '#000', grosor: 1 });
    const bumped = applyTextBoxPatch(on, { contornoGrosor: 4 });
    expect(bumped.contorno).toEqual({ color: '#000', grosor: 4 });
  });

  it('patch apaga contorno con ambos undefined', () => {
    const b: TextBlock = { ...base, contorno: { color: '#000', grosor: 1 } };
    const off = applyTextBoxPatch(b, { contornoColor: undefined, contornoGrosor: undefined });
    expect(off.contorno).toBeUndefined();
  });

  it('patch de degradado: enciende, ajusta ángulo sin perderlo, apaga', () => {
    const on = applyTextBoxPatch(base, {
      degradadoDesde: '#111',
      degradadoHasta: '#eee',
      degradadoAngulo: 90,
    });
    expect(on.degradado).toEqual({ desde: '#111', hasta: '#eee', angulo: 90 });

    const rotated = applyTextBoxPatch(on, { degradadoAngulo: 200 });
    expect(rotated.degradado).toEqual({ desde: '#111', hasta: '#eee', angulo: 200 });

    const off = applyTextBoxPatch(rotated, {
      degradadoDesde: undefined,
      degradadoHasta: undefined,
      degradadoAngulo: undefined,
    });
    expect(off.degradado).toBeUndefined();
  });

  it('textBlockDecorCss: stroke + gradient con color transparente', () => {
    const css = textBlockDecorCss({
      ...base,
      contorno: { color: '#000', grosor: 2 },
      degradado: { desde: '#6366f1', hasta: '#ec4899', angulo: 45 },
    });
    expect(css.WebkitTextStroke).toBe('2px #000');
    expect(css.backgroundImage).toBe('linear-gradient(45deg, #6366f1, #ec4899)');
    expect(css.WebkitBackgroundClip).toBe('text');
    expect(css.color).toBe('transparent');
  });

  it('textBlockDecorCss vacío cuando no hay nada', () => {
    expect(textBlockDecorCss(base)).toEqual({});
  });
});
