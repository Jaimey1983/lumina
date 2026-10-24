// Y24a (Regla 7): el texto «viejo» —formas con autoajuste, texto libre, rótulo de conector, alineaciones, saltos de línea,
// palabras largas— debe normalizarse y dibujarse **idéntico** después de añadir las viñetas. Los archivos de `__golden__/`
// (`texto-*`) se generaron con el código de `main` ANTES del cambio y no se regeneran (DY31).

import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { escenaASvg } from './render.js';

import viejaJson from './__golden__/texto-viejo.json?raw';
import normalizadaJson from './__golden__/texto-normalizar.json?raw';
import claro from './__golden__/texto-svg-claro.svg?raw';
import css from './__golden__/texto-svg-css.svg?raw';
import oscuro from './__golden__/texto-svg-oscuro.svg?raw';

const entrada: unknown = JSON.parse(viejaJson);
const SVG = { css, claro, oscuro };

describe('texto viejo idéntico (golden de Y24a)', () => {
  it('normalizarEscena da exactamente lo de antes, byte a byte, y es idempotente', () => {
    const e = normalizarEscena(entrada);
    expect(JSON.stringify(e, null, 1) + '\n').toBe(normalizadaJson);
    expect(JSON.stringify(normalizarEscena(e))).toBe(JSON.stringify(e));
  });

  it.each(['css', 'claro', 'oscuro'] as const)('el SVG en modo %s es el mismo, carácter por carácter', (modo) => {
    expect(escenaASvg(normalizarEscena(entrada), { modo, fondo: true, titulo: 'Golden Y24a', prefijoIds: 'g' }).svg + '\n').toBe(SVG[modo]);
  });
});
