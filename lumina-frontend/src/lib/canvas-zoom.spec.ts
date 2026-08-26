import { describe, expect, it } from 'vitest';

import {
  CANVAS_ZOOM_DEFAULT,
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_MIN,
  clampCanvasZoom,
  formatCanvasZoom,
  stepCanvasZoom,
  wheelDeltaToZoomStep,
} from '@/lib/canvas-zoom';

describe('canvas-zoom', () => {
  it('clampCanvasZoom respeta min/max', () => {
    expect(clampCanvasZoom(0.1)).toBe(CANVAS_ZOOM_MIN);
    expect(clampCanvasZoom(3)).toBe(CANVAS_ZOOM_MAX);
    expect(clampCanvasZoom(1.234)).toBe(1.23);
  });

  it('stepCanvasZoom suma y clamp', () => {
    expect(stepCanvasZoom(1, 0.1)).toBe(1.1);
    expect(stepCanvasZoom(CANVAS_ZOOM_MAX, 0.5)).toBe(CANVAS_ZOOM_MAX);
  });

  it('wheelDeltaToZoomStep invierte el signo de deltaY', () => {
    expect(wheelDeltaToZoomStep(120)).toBeLessThan(0);
    expect(wheelDeltaToZoomStep(-120)).toBeGreaterThan(0);
  });

  it('formatCanvasZoom muestra porcentaje', () => {
    expect(formatCanvasZoom(CANVAS_ZOOM_DEFAULT)).toBe('100%');
    expect(formatCanvasZoom(1.5)).toBe('150%');
  });
});
