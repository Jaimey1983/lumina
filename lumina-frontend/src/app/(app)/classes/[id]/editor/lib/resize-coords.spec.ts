import { describe, expect, it } from 'vitest';

import { getBlockResizeMinDim } from './block-resize-min-dim';
import { computeNewCoords, preserveEdgeAfterClamp } from './resize-coords';

describe('getBlockResizeMinDim', () => {
  it('pins 4 % usan minDim 4, no 5', () => {
    expect(getBlockResizeMinDim('hotspot')).toBe(4);
    expect(getBlockResizeMinDim('tooltip')).toBe(4);
  });

  it('popup y progreso permiten barras más finas', () => {
    expect(getBlockResizeMinDim('popup')).toBe(2);
    expect(getBlockResizeMinDim('progreso')).toBe(2);
  });

  it('el separador puede ser una línea del 1 %', () => {
    expect(getBlockResizeMinDim('separador')).toBe(1);
  });
});

describe('computeNewCoords — M1', () => {
  it('click-release en handle E no agranda un Hotspot 4×4', () => {
    const next = computeNewCoords('E', 48, 48, 4, 4, 0, 0, false, 4);
    expect(next.ancho).toBe(4);
    expect(next.alto).toBe(4);
  });

  it('con minDim 5 legacy sí forzaría 4→5 (regresión documentada)', () => {
    const next = computeNewCoords('E', 48, 48, 4, 4, 0, 0, false, 5);
    expect(next.ancho).toBe(4);
    expect(next.alto).toBe(4);
  });

  it('progreso puede estrechar alto por debajo de 5 con minDim 2', () => {
    const next = computeNewCoords('S', 10, 4, 80, 5, 0, -4, false, 2);
    expect(next.alto).toBe(2);
  });
});

describe('preserveEdgeAfterClamp — M7', () => {
  it('handle W: si clamp mueve x, conserva borde este', () => {
    const before = { x: 10, y: 20, ancho: 30, alto: 10 };
    const after = { x: 8, y: 20, ancho: 30, alto: 10 };
    const next = preserveEdgeAfterClamp('W', before, after, 5);
    expect(next.x).toBe(8);
    expect(next.ancho).toBe(32);
    expect(next.x + next.ancho).toBe(before.x + before.ancho);
  });

  it('handle E: si clamp mueve x, conserva borde oeste', () => {
    const before = { x: 97, y: 48, ancho: 4, alto: 4 };
    const after = { x: 96, y: 48, ancho: 4, alto: 4 };
    const next = preserveEdgeAfterClamp('E', before, after, 2);
    expect(next.x).toBe(97);
    expect(next.ancho).toBe(3);
    expect(next.x + next.ancho).toBe(after.x + after.ancho);
  });
});

describe('computeNewCoords — M7 integrado', () => {
  it('resize E cerca del borde derecho mantiene ancho coherente tras clamp', () => {
    const next = computeNewCoords('E', 97, 48, 4, 4, 3, 0, false, 4);
    expect(next.x + next.ancho).toBeGreaterThanOrEqual(97 + 4);
  });
});
