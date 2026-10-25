// Y32a (Regla 7, DY14): una escena vieja con las 22 formas del catálogo (y un id de forma que nunca será un icono, que cae en
// `rectangulo`) debe normalizarse y dibujarse **idéntica** después de añadir los iconos. Los archivos de `__golden__/` (`formas-*`)
// se generaron con el código de `main` ANTES del cambio y no se regeneran (DY31).

import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { escenaASvg } from './render.js';

import viejaJson from './__golden__/formas-vieja.json?raw';
import normalizadaJson from './__golden__/formas-normalizar.json?raw';
import claro from './__golden__/formas-svg-claro.svg?raw';
import claroSinFondo from './__golden__/formas-svg-claro-sin-fondo.svg?raw';
import css from './__golden__/formas-svg-css.svg?raw';
import oscuro from './__golden__/formas-svg-oscuro.svg?raw';

const entrada: unknown = JSON.parse(viejaJson);
const SVG = { css, claro, oscuro };
const OPCIONES = { fondo: true, titulo: 'Golden Y32a', prefijoIds: 'g' };

describe('escena vieja con las 22 formas idéntica (golden de Y32a)', () => {
  it('normalizarEscena da exactamente lo de antes, byte a byte, y es idempotente', () => {
    const e = normalizarEscena(entrada);
    expect(JSON.stringify(e, null, 1) + '\n').toBe(normalizadaJson);
    expect(JSON.stringify(normalizarEscena(e))).toBe(JSON.stringify(e));
  });

  it.each(['css', 'claro', 'oscuro'] as const)('el SVG en modo %s es el mismo, carácter por carácter', (modo) => {
    expect(escenaASvg(normalizarEscena(entrada), { modo, ...OPCIONES }).svg + '\n').toBe(SVG[modo]);
  });

  it('sin fondo también', () => {
    expect(escenaASvg(normalizarEscena(entrada), { modo: 'claro', ...OPCIONES, fondo: false }).svg + '\n').toBe(claroSinFondo);
  });

  it('el golden tiene lo que dice: 22 formas distintas, un id desconocido que cae en rectángulo y un conector', () => {
    const e = normalizarEscena(entrada);
    const formas = e.elementos.filter((x) => x.tipo === 'forma');
    expect(formas).toHaveLength(23);
    expect(new Set(formas.slice(0, 22).map((f) => (f.tipo === 'forma' ? f.forma : ''))).size).toBe(22);
    const ultima = formas[22];
    expect(ultima?.tipo === 'forma' && ultima.forma).toBe('rectangulo');
    expect(e.elementos.some((x) => x.tipo === 'linea')).toBe(true);
  });
});
