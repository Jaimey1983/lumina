import { describe, expect, it } from 'vitest';

import { snapAxisToGridPercent, gridStepPercent } from './grid.js';
import { VIRTUAL_CANVAS_WIDTH } from './virtual-canvas.js';

// Portado de lumina-frontend/src/lib/canvas-grid.spec.ts (la parte de snap; los
// helpers del modelo SlideGrilla se quedan en el frontend).
describe('snapAxisToGridPercent', () => {
  const stepPct40 = (40 / VIRTUAL_CANVAS_WIDTH) * 100;

  it('imanta el origen a la celda más cercana', () => {
    const raw = stepPct40 * 2 + stepPct40 * 0.2;
    const hit = snapAxisToGridPercent(raw, 10, 40, 'x', stepPct40 * 0.5);
    expect(hit).not.toBeNull();
    expect(hit!.snap).toBeCloseTo(stepPct40 * 2);
    expect(hit!.guide).toBeCloseTo(stepPct40 * 2);
  });

  it('devuelve null fuera del umbral', () => {
    const raw = stepPct40 * 2 + stepPct40 * 0.6;
    const hit = snapAxisToGridPercent(raw, 0.1, 40, 'x', stepPct40 * 0.3);
    expect(hit).toBeNull();
  });

  it('imanta también por centro y por borde del bloque', () => {
    const step = stepPct40;
    // centro del bloque (ancho 4·step) cae justo en una celda
    const size = step * 4;
    const raw = step * 3 - size / 2 + step * 0.1;
    const hit = snapAxisToGridPercent(raw, size, 40, 'x', step * 0.5);
    expect(hit).not.toBeNull();
    expect(hit!.snap).toBeCloseTo(step * 3 - size / 2);
  });

  it('gridStepPercent respeta el eje (X ≠ Y por el 16:9)', () => {
    expect(gridStepPercent(40, 'x')).toBeCloseTo((40 / 1280) * 100);
    expect(gridStepPercent(40, 'y')).toBeCloseTo((40 / 720) * 100);
  });
});
