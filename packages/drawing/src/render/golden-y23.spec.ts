// Y23 (Regla 7): la escena «vieja» —todo lo que el modelo tenía antes de Y23— debe normalizarse y dibujarse **idéntica**.
// Los archivos de `__golden__/` se generaron con el código de `main` ANTES del cambio y no se regeneran (DY31): un diff
// en ellos es motivo de rechazo. Un campo nuevo del modelo no puede moverlos.

import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { escenaASvg } from './render.js';

import viejaJson from './__golden__/escena-vieja.json?raw';
import normalizadaJson from './__golden__/normalizar.json?raw';
import claroCon from './__golden__/svg-claro-con-fondo.svg?raw';
import claroSin from './__golden__/svg-claro-sin-fondo.svg?raw';
import cssCon from './__golden__/svg-css-con-fondo.svg?raw';
import cssSin from './__golden__/svg-css-sin-fondo.svg?raw';
import oscuroCon from './__golden__/svg-oscuro-con-fondo.svg?raw';
import oscuroSin from './__golden__/svg-oscuro-sin-fondo.svg?raw';

const entrada: unknown = JSON.parse(viejaJson);
const SVG = { 'css-true': cssCon, 'css-false': cssSin, 'claro-true': claroCon, 'claro-false': claroSin, 'oscuro-true': oscuroCon, 'oscuro-false': oscuroSin };

describe('escena vieja idéntica (golden de Y23)', () => {
  it('normalizarEscena da exactamente lo de antes, byte a byte', () => {
    expect(JSON.stringify(normalizarEscena(entrada), null, 1) + '\n').toBe(normalizadaJson);
  });

  it('es idempotente: normalizar lo ya normalizado no cambia nada', () => {
    const una = normalizarEscena(entrada);
    expect(JSON.stringify(normalizarEscena(una))).toBe(JSON.stringify(una));
  });

  it.each([
    ['css', true],
    ['css', false],
    ['claro', true],
    ['claro', false],
    ['oscuro', true],
    ['oscuro', false],
  ] as const)('el SVG en modo %s %s fondo es el mismo, carácter por carácter', (modo, fondo) => {
    const e = normalizarEscena(entrada);
    const conFondo = { ...e, fondo: fondo ? e.fondo : null };
    const svg = escenaASvg(conFondo, { modo, fondo, titulo: 'Golden Y23', prefijoIds: 'g' }).svg + '\n';
    expect(svg).toBe(SVG[`${modo}-${fondo}`]);
  });
});
