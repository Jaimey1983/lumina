import { describe, expect, it } from 'vitest';
import type { DiagramaGrafoBlock, DiagramaNodoForma } from '@lumina/types/slide';

import { createDefaultFlujoBlock } from './diagrama-defaults.js';
import { diagramaToSvg, medirNodo } from './diagrama-export.js';

// W10: el SVG del diagrama clásico dejó de llevar su propia geometría (`formaSvg`) y dibuja con `trazadoForma` de
// `@lumina/drawing`. Estas pruebas comparan, forma por forma, lo que sale ahora con la geometría anterior
// (reproducida aquí con las fórmulas de entonces): misma entrada → misma figura visible.

const FORMAS: DiagramaNodoForma[] = ['rect', 'rounded', 'pill', 'chip', 'root', 'card-icon', 'diamond', 'parallelogram', 'ellipse', 'circle', 'hexagon', 'trapezoid', 'inverted-trapezoid', 'triangle'];

type P = [number, number];

function bloqueConTodasLasFormas(): DiagramaGrafoBlock {
  const base = createDefaultFlujoBlock({ id: 'b-formas' }) as DiagramaGrafoBlock;
  return {
    ...base,
    // El círculo lleva un alto propio distinto de su ancho: así se ve si se dibuja como elipse (llena la caja) o como círculo inscrito.
    nodos: FORMAS.map((forma, i) => ({ ...base.nodos[0]!, id: `n${i}`, etiqueta: `Nodo ${i}`, forma, ...(forma === 'circle' ? { alto: 60 } : {}) })),
    aristas: [],
  };
}

function figuraDe(doc: Document, id: string): { d: string; x: number; y: number; relleno: string | null; borde: string | null; grosor: string | null } {
  const path = doc.querySelector(`g[data-nodo-id="${id}"] path`);
  if (!path) throw new Error(`El nodo ${id} no tiene figura`);
  const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(path.getAttribute('transform') ?? '');
  if (!m) throw new Error(`El nodo ${id} no está trasladado`);
  return { d: path.getAttribute('d') ?? '', x: Number(m[1]), y: Number(m[2]), relleno: path.getAttribute('fill'), borde: path.getAttribute('stroke'), grosor: path.getAttribute('stroke-width') };
}

/** Vértices de un trazado hecho solo de M/L/Z (las formas poligonales). */
function vertices(d: string): P[] {
  return [...d.matchAll(/[ML]\s*(-?[\d.]+)[ ,]\s*(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as P);
}

/** La geometría de `formaSvg` antes de W10, tal cual. */
function poligonoAnterior(forma: DiagramaNodoForma, x: number, y: number, w: number, h: number): P[] | null {
  switch (forma) {
    case 'diamond':
      return [
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
        [x, y + h / 2],
      ];
    case 'hexagon': {
      const k = w * 0.16;
      return [
        [x + k, y],
        [x + w - k, y],
        [x + w, y + h / 2],
        [x + w - k, y + h],
        [x + k, y + h],
        [x, y + h / 2],
      ];
    }
    case 'parallelogram': {
      const k = w * 0.12;
      return [
        [x + k, y],
        [x + w, y],
        [x + w - k, y + h],
        [x, y + h],
      ];
    }
    case 'trapezoid':
      return [
        [x + w * 0.04, y],
        [x + w * 0.96, y],
        [x + w, y + h],
        [x, y + h],
      ];
    case 'inverted-trapezoid':
      return [
        [x, y],
        [x + w, y],
        [x + w * 0.96, y + h],
        [x + w * 0.04, y + h],
      ];
    case 'triangle':
      return [
        [x + w / 2, y],
        [x + w, y + h],
        [x, y + h],
      ];
    default:
      return null;
  }
}

const cerca = (a: P[], b: P[]): void => {
  expect(a).toHaveLength(b.length);
  a.forEach(([ax, ay], i) => {
    expect(ax).toBeCloseTo(b[i]![0], 1);
    expect(ay).toBeCloseTo(b[i]![1], 1);
  });
};

describe('diagramaToSvg: figuras de los nodos (paridad con la geometría anterior, W10)', () => {
  const block = bloqueConTodasLasFormas();
  const doc = new DOMParser().parseFromString(diagramaToSvg(block).svg, 'image/svg+xml');

  it('todas las formas dan un SVG válido con una figura por nodo, sin figuras sueltas', () => {
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelectorAll('g[data-nodo-id]')).toHaveLength(FORMAS.length);
    for (const n of block.nodos) expect(doc.querySelectorAll(`g[data-nodo-id="${n.id}"] > path`)).toHaveLength(1);
  });

  it.each(FORMAS.map((f, i) => [f, i] as const))('%s: la figura ocupa la caja del nodo y conserva relleno, borde y grosor', (forma, i) => {
    const n = block.nodos[i]!;
    const caja = medirNodo({ ...n, forma });
    const f = figuraDe(doc, n.id);
    expect(f.relleno).toMatch(/^#[0-9a-f]{6}$/i);
    expect(f.borde).toMatch(/^#[0-9a-f]{6}$/i);
    expect(f.grosor).toBe('2');
    if (forma === 'ellipse' || forma === 'circle') {
      // Elipse (y círculo, que se exporta igual): radios = mitad de la caja.
      expect(f.d).toContain(`A${caja.ancho / 2},${caja.alto / 2}`);
      return;
    }
    const pts = vertices(f.d);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    expect(Math.min(...xs)).toBeCloseTo(0, 1);
    expect(Math.min(...ys)).toBeCloseTo(0, 1);
    expect(Math.max(...xs)).toBeCloseTo(caja.ancho, 1);
    expect(Math.max(...ys)).toBeCloseTo(caja.alto, 1);
  });

  it.each(FORMAS.filter((f) => poligonoAnterior(f, 0, 0, 100, 60)).map((f) => [f] as const))('%s: los vértices son exactamente los de antes', (forma) => {
    const i = FORMAS.indexOf(forma);
    const n = block.nodos[i]!;
    const caja = medirNodo({ ...n, forma });
    const f = figuraDe(doc, n.id);
    const ahora = vertices(f.d).map(([px, py]) => [px + f.x, py + f.y] as P);
    cerca(ahora, poligonoAnterior(forma, f.x, f.y, caja.ancho, caja.alto)!);
  });

  it.each([
    ['pill', 'alto/2', (alto: number) => alto / 2],
    ['chip', 'alto/2', (alto: number) => alto / 2],
    ['root', '12', () => 12],
    ['rounded', '8', () => 8],
    ['card-icon', '8', () => 8],
  ] as const)('%s: esquinas redondeadas de %s', (forma, _t, radio) => {
    const i = FORMAS.indexOf(forma);
    const caja = medirNodo({ ...block.nodos[i]!, forma });
    const r = Math.min(radio(caja.alto), caja.ancho / 2, caja.alto / 2);
    expect(figuraDe(doc, block.nodos[i]!.id).d).toContain(`A${r},${r}`);
  });

  it('rect: esquinas rectas (sin arcos)', () => {
    expect(figuraDe(doc, block.nodos[FORMAS.indexOf('rect')]!.id).d).not.toContain('A');
  });

  it('circle: se dibuja como antes, una elipse que llena la caja (aunque la caja no sea cuadrada)', () => {
    const i = FORMAS.indexOf('circle');
    const caja = medirNodo({ ...block.nodos[i]!, forma: 'circle' });
    expect(figuraDe(doc, block.nodos[i]!.id).d).toContain(`A${caja.ancho / 2},${caja.alto / 2}`);
  });

  it('una forma desconocida cae en rectángulo redondeado de 8, como antes', () => {
    const base = createDefaultFlujoBlock({ id: 'b-raro' }) as DiagramaGrafoBlock;
    const raro: DiagramaGrafoBlock = { ...base, nodos: [{ ...base.nodos[0]!, forma: 'inventada' as DiagramaNodoForma }], aristas: [] };
    const d = new DOMParser().parseFromString(diagramaToSvg(raro).svg, 'image/svg+xml');
    expect(d.querySelector('parsererror')).toBeNull();
    expect(figuraDe(d, raro.nodos[0]!.id).d).toContain('A8,8');
  });
});
