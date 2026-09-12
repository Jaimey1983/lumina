import { describe, expect, it } from 'vitest';

import { computePairMeasurement } from './measurements.js';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from './virtual-canvas.js';

// G4 — herramienta de medición (mantener tecla + hover).
describe('computePairMeasurement', () => {
  it('mide el hueco horizontal entre dos bloques que comparten banda vertical', () => {
    const a = { x: 10, y: 20, ancho: 10, alto: 10 };
    const b = { x: 40, y: 22, ancho: 10, alto: 10 };
    const lines = computePairMeasurement(a, b, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    const h = lines.find((l) => l.type === 'horizontal');
    expect(h).toBeDefined();
    const expectedGapPx = ((40 - 20) / 100) * VIRTUAL_CANVAS_WIDTH;
    expect(h!.distance).toBeCloseTo(expectedGapPx, 5);
    expect(h!.minX_pct).toBeCloseTo(20, 5);
    expect(h!.maxX_pct).toBeCloseTo(40, 5);
    // No hay banda horizontal compartida (mismo ancho, y distinto pero se
    // solapan igual porque 20-30 y 22-32 se cruzan) — no debe haber vertical.
    expect(lines.find((l) => l.type === 'vertical')).toBeUndefined();
  });

  it('mide el hueco vertical entre dos bloques que comparten banda horizontal', () => {
    const a = { x: 10, y: 10, ancho: 10, alto: 10 };
    const b = { x: 12, y: 40, ancho: 10, alto: 10 };
    const lines = computePairMeasurement(a, b, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    const v = lines.find((l) => l.type === 'vertical');
    expect(v).toBeDefined();
    const expectedGapPx = ((40 - 20) / 100) * VIRTUAL_CANVAS_HEIGHT;
    expect(v!.distance).toBeCloseTo(expectedGapPx, 5);
    expect(lines.find((l) => l.type === 'horizontal')).toBeUndefined();
  });

  it('produce ambas cotas para bloques en diagonal (sin banda compartida)', () => {
    const a = { x: 5, y: 5, ancho: 10, alto: 10 };
    const b = { x: 50, y: 50, ancho: 10, alto: 10 };
    const lines = computePairMeasurement(a, b, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    expect(lines.find((l) => l.type === 'horizontal')).toBeDefined();
    expect(lines.find((l) => l.type === 'vertical')).toBeDefined();
  });

  it('no mide el eje en el que los bloques se solapan', () => {
    const a = { x: 10, y: 10, ancho: 30, alto: 10 };
    const b = { x: 20, y: 40, ancho: 10, alto: 10 };
    const lines = computePairMeasurement(a, b, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    // Se solapan en X (10-40 vs 20-30) → sin cota horizontal, solo vertical.
    expect(lines.find((l) => l.type === 'horizontal')).toBeUndefined();
    expect(lines.find((l) => l.type === 'vertical')).toBeDefined();
  });

  it('es simétrica: da el mismo resultado sin importar el orden de los argumentos', () => {
    const a = { x: 10, y: 20, ancho: 10, alto: 10 };
    const b = { x: 40, y: 22, ancho: 10, alto: 10 };
    const ab = computePairMeasurement(a, b, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    const ba = computePairMeasurement(b, a, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    expect(ab[0]!.distance).toBeCloseTo(ba[0]!.distance, 5);
  });

  it('no mide nada entre bloques que se solapan en ambos ejes', () => {
    const a = { x: 10, y: 10, ancho: 20, alto: 20 };
    const b = { x: 15, y: 15, ancho: 5, alto: 5 };
    const lines = computePairMeasurement(a, b, VIRTUAL_CANVAS_WIDTH, VIRTUAL_CANVAS_HEIGHT);
    expect(lines).toHaveLength(0);
  });
});
