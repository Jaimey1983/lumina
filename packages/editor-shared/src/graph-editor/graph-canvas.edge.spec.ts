import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Position, type EdgeProps } from '@xyflow/react';
import { describe, expect, it } from 'vitest';

import { LuminaEdge } from './graph-canvas.js';

function trazado(tipoTrazado: string): string {
  const props = {
    id: 'e1',
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 60,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { tipoTrazado },
  } as unknown as EdgeProps;
  const html = renderToStaticMarkup(createElement('svg', null, createElement(LuminaEdge, props)));
  const d = /<path[^>]*\sd="([^"]+)"/.exec(html);
  if (!d) throw new Error(`sin <path> en: ${html}`);
  return d[1];
}

/** Cuenta los tramos `Q` cuyo punto de control no coincide con el destino (esquinas realmente curvas). */
function esquinasCurvas(d: string): number {
  return [...d.matchAll(/Q\s*([\d.,-]+)\s+([\d.,-]+)/g)].filter((m) => m[1] !== m[2]).length;
}

describe('LuminaEdge — trazado (V1.2)', () => {
  it('`orthogonal` dibuja ángulos rectos y `smoothstep` esquinas redondeadas', () => {
    const recto = trazado('orthogonal');
    const suave = trazado('smoothstep');
    expect(esquinasCurvas(recto)).toBe(0);
    expect(esquinasCurvas(suave)).toBeGreaterThan(0);
    expect(recto).not.toBe(suave);
  });
});
