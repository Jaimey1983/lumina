import { describe, expect, it } from 'vitest';

import type { Block } from '@lumina/types/slide';

import { computeSnap } from './compute-snap.js';
import { snapPositionToGuides, snapThresholdPct } from './snap.js';
import { snapResizeSize } from './resize-snap.js';

function texto(x: number, y: number, overrides?: Partial<Block>): Block {
  return {
    tipo: 'texto',
    contenido: 'Bloque',
    x,
    y,
    ancho: 20,
    alto: 10,
    ...overrides,
  } as Block;
}

describe('computeSnap — sin rotación, paridad con snapPositionToGuides', () => {
  it('mismo rect y mismas guías que la función portada', () => {
    const near = 25 + snapThresholdPct('x') * 0.5;
    const peers = [texto(80, 80)];
    const guias = { verticales: [320], horizontales: [] };

    const legacy = snapPositionToGuides(near, 10, 10, 10, 0, peers, { guias });
    const unified = computeSnap(near, 10, 10, 10, 0, peers, { guias });

    expect(unified.rect.x).toBeCloseTo(legacy.x);
    expect(unified.rect.y).toBeCloseTo(legacy.y);
    expect(unified.guides).toEqual(legacy.lines);
  });
});

describe('computeSnap — OBB (rotación)', () => {
  // bloque 20%×20% en (20,20) → centro px (384, 216); rotado 90° el AABB mide
  // 144 px de ancho → borde izquierdo en 312 px = 24.375 %.
  const guideXpx = 312;
  const rawX = 20 + 0.3;

  it('un bloque rotado 90° imanta por su AABB, no por la caja sin rotar', () => {
    const { rect, guides } = computeSnap(rawX, 20, 20, 20, 0, [texto(80, 80)], {
      guias: { verticales: [guideXpx], horizontales: [] },
      rotacionDeg: 90,
    });
    // el origen sin rotar vuelve a 20 (el delta del AABB se aplica igual al origen)
    expect(rect.x).toBeCloseTo(20, 3);
    expect(guides).toContainEqual({
      orientation: 'vertical',
      position: 24.375,
      kind: 'align',
    });
  });

  it('sin rotación, el mismo caso NO imanta (la caja cruda no llega a la guía)', () => {
    const { guides } = computeSnap(rawX, 20, 20, 20, 0, [texto(80, 80)], {
      guias: { verticales: [guideXpx], horizontales: [] },
    });
    expect(guides).toEqual([]);
  });
});

describe('computeSnap — cotas de distancia', () => {
  it('devuelve una cota al vecino aunque no haya snap de posición', () => {
    // activo (40,32,9×11) y vecino (60,10,10×40) solapan en vertical; ningún
    // borde cae en el umbral de imán → sin guía, pero sí una cota 'neighbor'.
    const peers = [texto(60, 10, { ancho: 10, alto: 40 })];
    const { guides, measurements } = computeSnap(40, 32, 9, 11, -1, peers, {});
    expect(guides).toEqual([]);
    expect(measurements.some((m) => m.role === 'neighbor')).toBe(true);
  });

  it('skipMeasurements las omite', () => {
    const peers = [texto(60, 10, { ancho: 10, alto: 40 })];
    const { measurements } = computeSnap(40, 32, 9, 11, -1, peers, {
      skipMeasurements: true,
    });
    expect(measurements).toEqual([]);
  });

  it('enabled:false → sin rect imantado, sin guías, sin cotas', () => {
    const peers = [texto(70, 20, { ancho: 10, alto: 20 })];
    const r = computeSnap(40.4, 22, 10, 16, -1, peers, {
      guias: { verticales: [520], horizontales: [] },
      enabled: false,
    });
    expect(r.rect.x).toBeCloseTo(40.4);
    expect(r.guides).toEqual([]);
    expect(r.measurements).toEqual([]);
  });
});

describe('snapResizeSize — snap de tamaño (nuevo en G0)', () => {
  it('iguala el ancho al de un vecino dentro del umbral', () => {
    const peers = [{ x: 0, y: 0, ancho: 30, alto: 12 }];
    const t = snapThresholdPct('x');
    const { ancho, alto, matches } = snapResizeSize(30 + t * 0.5, 40, peers);
    expect(ancho).toBeCloseTo(30);
    expect(alto).toBe(40); // ningún alto de vecino ni fracción cerca
    expect(matches).toContainEqual({ axis: 'ancho', peerIndex: 0, value: 30 });
  });

  it('iguala a la mitad del lienzo', () => {
    const { ancho, matches } = snapResizeSize(49.8, 33, []);
    expect(ancho).toBeCloseTo(50);
    expect(matches).toContainEqual({ axis: 'ancho', peerIndex: -1, value: 50 });
  });

  it('enabled:false devuelve los valores crudos', () => {
    const peers = [{ x: 0, y: 0, ancho: 30, alto: 12 }];
    const r = snapResizeSize(30.1, 12.1, peers, { enabled: false });
    expect(r).toEqual({ ancho: 30.1, alto: 12.1, matches: [] });
  });
});
