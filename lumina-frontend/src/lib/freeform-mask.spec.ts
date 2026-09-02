import { describe, expect, it } from 'vitest';

import type { ClipPathNode, FreeformMaskPath, MaskNode } from '@/types/slide.types';
import {
  appendMaskNode,
  computeCornerFillet,
  cornerFilletEligible,
  createDefaultFreeformPath,
  createEmptyFreeformPath,
  freeformPathToSvgD,
  migrateLibreNodesToFreeform,
  normalizeFreeformPath,
  removeLastMaskNode,
  resolveFreeformPath,
} from '@/lib/freeform-mask';

const corner = (x: number, y: number, cornerRadius?: number): MaskNode => ({
  id: `${x}-${y}`,
  point: { x, y },
  handleIn: null,
  handleOut: null,
  ...(cornerRadius ? { cornerRadius } : {}),
});

const square: MaskNode[] = [
  corner(0.1, 0.1),
  corner(0.9, 0.1),
  corner(0.9, 0.9),
  corner(0.1, 0.9),
];

describe('createDefaultFreeformPath', () => {
  it('crea un contorno cerrado con ids únicos y sin manijas', () => {
    const p = createDefaultFreeformPath();
    expect(p.closed).toBe(true);
    expect(p.nodes.length).toBeGreaterThanOrEqual(3);
    expect(p.nodes.every((n) => n.handleIn === null && n.handleOut === null)).toBe(true);
    expect(new Set(p.nodes.map((n) => n.id)).size).toBe(p.nodes.length);
  });
});

describe('freeformPathToSvgD', () => {
  it('contorno recto genera comandos L y cierra con Z', () => {
    const path: FreeformMaskPath = {
      closed: true,
      nodes: [
        { id: 'a', point: { x: 0.1, y: 0.1 }, handleIn: null, handleOut: null },
        { id: 'b', point: { x: 0.9, y: 0.1 }, handleIn: null, handleOut: null },
        { id: 'c', point: { x: 0.5, y: 0.9 }, handleIn: null, handleOut: null },
      ],
    };
    const d = freeformPathToSvgD(path);
    expect(d.startsWith('M 0.1,0.1')).toBe(true);
    expect(d).toContain(' L ');
    expect(d.endsWith(' Z')).toBe(true);
  });

  it('manija saliente/entrante produce una curva C con puntos de control absolutos', () => {
    const path: FreeformMaskPath = {
      closed: false,
      nodes: [
        { id: 'a', point: { x: 0, y: 0.5 }, handleIn: null, handleOut: { x: 0.3, y: -0.5 } },
        { id: 'b', point: { x: 1, y: 0.5 }, handleIn: { x: -0.3, y: 0.5 }, handleOut: null },
      ],
    };
    const d = freeformPathToSvgD(path);
    // c1 = point_a + handleOut_a = (0.3, 0) ; c2 = point_b + handleIn_b = (0.7, 1)
    expect(d).toBe('M 0,0.5 C 0.3,0 0.7,1 1,0.5');
  });

  it('degenerado (<2 nodos) cae a la caja unidad', () => {
    expect(freeformPathToSvgD(createEmptyFreeformPath())).toBe('M 0,0 H 1 V 1 H 0 Z');
  });

  it('contorno recto cerrado no emite un `L` redundante hacia el primer nodo', () => {
    const d = freeformPathToSvgD({ closed: true, nodes: square });
    expect(d).toBe('M 0.1,0.1 L 0.9,0.1 L 0.9,0.9 L 0.1,0.9 Z');
  });
});

describe('redondeo de esquinas (cornerRadius)', () => {
  it('cornerFilletEligible: true para esquina recta de contorno cerrado', () => {
    expect(cornerFilletEligible(square, 0, true)).toBe(true);
    expect(cornerFilletEligible(square, 0, false)).toBe(false);
    const withHandle: MaskNode[] = [
      { ...square[0], handleOut: { x: 0.05, y: 0 } },
      square[1],
      square[2],
      square[3],
    ];
    // el nodo 1 deja de ser elegible: su arista entrante es curva
    expect(cornerFilletEligible(withHandle, 1, true)).toBe(false);
  });

  it('computeCornerFillet recorta a media arista como máximo', () => {
    // Aristas de longitud 1 ⇒ recorte máximo 0.5; un valor exagerado se limita.
    const f = computeCornerFillet({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, 999);
    expect(f).not.toBeNull();
    expect(f!.trim).toBeCloseTo(0.5, 5);
  });

  it('devuelve null en esquina casi recta', () => {
    const f = computeCornerFillet({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0.0001 }, 0.2);
    expect(f).toBeNull();
  });

  it('un cuadrado con cornerRadius sustituye cada vértice por una curva C', () => {
    const sharp = freeformPathToSvgD({ closed: true, nodes: square });
    const rounded = freeformPathToSvgD({
      closed: true,
      nodes: square.map((s) => ({ ...s, cornerRadius: 0.15 })),
    });
    expect(sharp).not.toContain('C ');
    expect((rounded.match(/C /g) ?? []).length).toBe(4);
    expect(rounded.endsWith(' Z')).toBe(true);
  });

  it('cornerRadius se ignora si el nodo tiene manijas', () => {
    const d = freeformPathToSvgD({
      closed: true,
      nodes: [
        { ...square[0], handleOut: { x: 0.1, y: 0 }, cornerRadius: 0.2 },
        square[1],
        square[2],
        square[3],
      ],
    });
    // la curva del nodo 0 viene de su manija, no de un fillet; los otros vértices
    // siguen siendo esquinas rectas (sin fillet porque una arista vecina es curva)
    expect((d.match(/C /g) ?? []).length).toBe(1);
  });
});

describe('migrateLibreNodesToFreeform', () => {
  it('convierte manijas absolutas (cpIn/cpOut) en relativas al punto y descarta tipo', () => {
    const nodos: ClipPathNode[] = [
      { id: 'n1', x: 0.5, y: 0.5, cpOut: { x: 0.7, y: 0.5 }, tipo: 'symmetric' },
      { id: 'n2', x: 0.2, y: 0.8, cpIn: { x: 0.1, y: 0.7 }, tipo: 'corner' },
      { id: 'n3', x: 0.8, y: 0.8, tipo: 'corner' },
    ];
    const p = migrateLibreNodesToFreeform(nodos, true);
    expect(p.closed).toBe(true);
    expect(p.nodes[0]).toEqual({
      id: 'n1',
      point: { x: 0.5, y: 0.5 },
      handleIn: null,
      handleOut: { x: 0.2, y: 0 },
    });
    expect(p.nodes[1].handleIn).toEqual({ x: -0.1, y: -0.1 });
    expect(p.nodes[2].handleIn).toBeNull();
    // el modelo nuevo no tiene campo `tipo`
    expect('tipo' in p.nodes[0]).toBe(false);
  });

  it('lista vacía → contorno por defecto', () => {
    expect(migrateLibreNodesToFreeform([], true).nodes.length).toBeGreaterThanOrEqual(3);
  });
});

describe('resolveFreeformPath', () => {
  it('prioriza `path` nuevo sobre `nodos` legado', () => {
    const p = resolveFreeformPath({
      tipo: 'libre',
      path: {
        closed: false,
        nodes: [
          { id: 'x', point: { x: 0, y: 0 }, handleIn: null, handleOut: null },
          { id: 'y', point: { x: 1, y: 1 }, handleIn: null, handleOut: null },
        ],
      },
      nodos: [{ x: 0.9, y: 0.9 }],
      cerrado: true,
    });
    expect(p.closed).toBe(false);
    expect(p.nodes).toHaveLength(2);
  });

  it('migra desde `nodos` legado cuando no hay `path`', () => {
    const p = resolveFreeformPath({
      tipo: 'libre',
      nodos: [
        { id: 'a', x: 0.1, y: 0.1 },
        { id: 'b', x: 0.9, y: 0.1 },
        { id: 'c', x: 0.5, y: 0.9 },
      ],
      cerrado: false,
    });
    expect(p.closed).toBe(false);
    expect(p.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('normalizeFreeformPath', () => {
  it('clampa puntos a 0–1, saNea manijas ~0 a null y rellena ids', () => {
    const p = normalizeFreeformPath({
      closed: true,
      nodes: [
        { id: '', point: { x: -1, y: 2 }, handleIn: { x: 0, y: 0 }, handleOut: { x: 0.1, y: 0 } },
        { id: 'k', point: { x: 0.5, y: 0.5 }, handleIn: null, handleOut: null },
        { id: 'm', point: { x: 0.5, y: 0.9 }, handleIn: null, handleOut: null },
      ],
    });
    expect(p.nodes[0].point).toEqual({ x: 0, y: 1 });
    expect(p.nodes[0].handleIn).toBeNull();
    expect(p.nodes[0].handleOut).toEqual({ x: 0.1, y: 0 });
    expect(p.nodes[0].id).not.toBe('');
  });
});

describe('appendMaskNode / removeLastMaskNode', () => {
  it('añade un nodo en el punto medio último↔primero', () => {
    const base = createEmptyFreeformPath();
    base.nodes.push(
      { id: 'a', point: { x: 0, y: 0 }, handleIn: null, handleOut: null },
      { id: 'b', point: { x: 1, y: 0 }, handleIn: null, handleOut: null },
    );
    const p = appendMaskNode(base);
    expect(p.nodes).toHaveLength(3);
    expect(p.nodes[2].point).toEqual({ x: 0.5, y: 0 });
  });

  it('no baja de 3 nodos', () => {
    const p = createDefaultFreeformPath();
    const three: FreeformMaskPath = { ...p, nodes: p.nodes.slice(0, 3) };
    expect(removeLastMaskNode(three).nodes).toHaveLength(3);
    expect(removeLastMaskNode(p).nodes).toHaveLength(p.nodes.length - 1);
  });
});
