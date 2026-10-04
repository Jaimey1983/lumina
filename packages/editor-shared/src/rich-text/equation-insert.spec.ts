import { describe, expect, it } from 'vitest';
import {
  MATH_CARET_SLOT,
  MATH_PALETTE,
  MATH_TABS,
  nextMathSlot,
  applyMathTemplate,
  deleteMathAt,
} from './equation-insert.js';

const sqrt = `\\sqrt{${MATH_CARET_SLOT}}`;
const frac = `\\frac{${MATH_CARET_SLOT}}{}`;
const brace = `\\left\\{${MATH_CARET_SLOT}\\right\\}`;
const abs = `\\left|${MATH_CARET_SLOT}\\right|`;

describe('applyMathTemplate', () => {
  it('deja el cursor dentro de la raíz', () => {
    const r = applyMathTemplate('', 0, 0, sqrt);
    expect(r.value).toBe('\\sqrt{}');
    expect(r.caret).toBe('\\sqrt{'.length);
    expect(r.caretEnd).toBe(r.caret);
  });

  it('envuelve la selección en una fracción y deja el cursor en el numerador', () => {
    const r = applyMathTemplate('a+b', 0, 3, frac);
    expect(r.value).toBe('\\frac{a+b}{}');
    expect(r.caret).toBe('\\frac{a+b'.length);
  });

  it('inserta llaves alrededor de lo seleccionado', () => {
    const r = applyMathTemplate('x', 0, 1, brace);
    expect(r.value).toBe('\\left\\{x\\right\\}');
    expect(r.value).not.toContain(MATH_CARET_SLOT);
    expect(r.caret).toBe('\\left\\{x'.length);
  });

  it('el valor absoluto no confunde la barra con el hueco del cursor', () => {
    const r = applyMathTemplate('x', 0, 1, abs);
    expect(r.value).toBe('\\left|x\\right|');
    expect(r.caret).toBe('\\left|x'.length);
  });

  it('un signo sin hueco se inserta en el cursor y reemplaza la selección', () => {
    expect(applyMathTemplate('12', 2, 2, '+').value).toBe('12+');
    expect(applyMathTemplate('12', 0, 2, '\\times')).toEqual({
      value: '\\times',
      caret: '\\times'.length,
      caretEnd: '\\times'.length,
    });
  });

  it('acota índices fuera de rango', () => {
    const r = applyMathTemplate('ab', -4, 99, '=');
    expect(r.value).toBe('=');
    expect(r.caret).toBe(1);
  });

  it('cada plantilla de la paleta tiene como máximo un hueco de cursor', () => {
    for (const group of MATH_PALETTE) {
      for (const item of group.items) {
        const count = item.template.split(MATH_CARET_SLOT).length - 1;
        expect(count, item.id).toBeLessThanOrEqual(1);
        const placed = applyMathTemplate('z', 0, 1, item.template);
        expect(placed.value, item.id).not.toContain(MATH_CARET_SLOT);
      }
    }
  });
});

describe('deleteMathAt', () => {
  it('borra la selección o el carácter anterior', () => {
    expect(deleteMathAt('abc', 1, 3)).toEqual({ value: 'a', caret: 1, caretEnd: 1 });
    expect(deleteMathAt('abc', 2, 2)).toEqual({ value: 'ac', caret: 1, caretEnd: 1 });
    expect(deleteMathAt('abc', 0, 0)).toEqual({ value: 'abc', caret: 0, caretEnd: 0 });
  });
});

describe('nextMathSlot', () => {
  it('salta de la llave del numerador al denominador vacío', () => {
    const src = '\frac{a}{}';
    const caret = '\frac{a'.length;
    expect(nextMathSlot(src, caret)).toBe('\frac{a}{'.length);
  });

  it('si no hay hueco vacío sale del grupo actual', () => {
    const src = '\sqrt{x}+1';
    expect(nextMathSlot(src, '\sqrt{x'.length)).toBe('\sqrt{x}'.length);
  });

  it('devuelve null si no queda ningún destino', () => {
    expect(nextMathSlot('x+1', 1)).toBeNull();
  });
});

describe('MATH_TABS', () => {
  it('no repite ids de símbolos y todos tienen plantilla', () => {
    const ids = MATH_PALETTE.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of MATH_PALETTE) {
      for (const i of g.items) expect(i.template.length).toBeGreaterThan(0);
    }
  });

  it('ofrece las categorías esperadas', () => {
    expect(MATH_TABS.map((t) => t.id)).toEqual([
      'basico',
      'algebra',
      'geometria',
      'trig',
      'calculo',
      'griegas',
      'quimica',
      'plantillas',
    ]);
  });
});
