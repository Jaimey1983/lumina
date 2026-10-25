// Y38a (Regla 7, DY73): una escena vieja con ramas —un árbol de formas con conectores rectos y en ángulo recto, una forma oculta a
// mano, un grupo y un texto— debe normalizarse y dibujarse **idéntica** después de añadir `colapsado`. Los archivos de `__golden__/`
// (`rama-*`) se generaron con el código de `main` ANTES del cambio y no se regeneran (DY31).

import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { escenaASvg } from './render.js';

import viejaJson from './__golden__/rama-vieja.json?raw';
import normalizadaJson from './__golden__/rama-normalizar.json?raw';
import claro from './__golden__/rama-svg-claro.svg?raw';
import claroSinFondo from './__golden__/rama-svg-claro-sin-fondo.svg?raw';
import css from './__golden__/rama-svg-css.svg?raw';
import oscuro from './__golden__/rama-svg-oscuro.svg?raw';

const entrada: unknown = JSON.parse(viejaJson);
const SVG = { css, claro, oscuro };

describe('escena vieja con ramas idéntica (golden de Y38a)', () => {
  it('normalizarEscena da exactamente lo de antes, byte a byte, y es idempotente', () => {
    const e = normalizarEscena(entrada);
    expect(JSON.stringify(e, null, 1) + '\n').toBe(normalizadaJson);
    expect(JSON.stringify(normalizarEscena(e))).toBe(JSON.stringify(e));
  });

  it.each(['css', 'claro', 'oscuro'] as const)('el SVG en modo %s es el mismo, carácter por carácter', (modo) => {
    expect(escenaASvg(normalizarEscena(entrada), { modo, fondo: true, titulo: 'Golden Y38a', prefijoIds: 'g' }).svg + '\n').toBe(SVG[modo]);
  });

  it('sin fondo también', () => {
    expect(escenaASvg(normalizarEscena(entrada), { modo: 'claro', fondo: false, titulo: 'Golden Y38a', prefijoIds: 'g' }).svg + '\n').toBe(claroSinFondo);
  });

  it('el golden tiene lo que dice: ramas con conectores, una forma oculta a mano, un grupo y un texto', () => {
    const e = normalizarEscena(entrada);
    expect(e.elementos.filter((x) => x.tipo === 'forma')).toHaveLength(10);
    expect(e.elementos.filter((x) => x.tipo === 'linea')).toHaveLength(8);
    expect(e.elementos.some((x) => x.tipo === 'forma' && x.oculto)).toBe(true);
    expect(e.elementos.some((x) => x.tipo === 'grupo')).toBe(true);
    expect(e.elementos.some((x) => x.tipo === 'texto')).toBe(true);
    expect(e.elementos.some((x) => x.tipo === 'linea' && x.trazado === 'ortogonal')).toBe(true);
  });
});
