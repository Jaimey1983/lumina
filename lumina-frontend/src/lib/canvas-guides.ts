import type { SlideGuias } from '@/types/slide.types';
import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';

export const VIRTUAL_CANVAS_WIDTH = 1280;
export const VIRTUAL_CANVAS_HEIGHT = 720;
export const RULER_SIZE_PX = 16;

export function clampVirtualX(x: number): number {
  return Math.max(0, Math.min(VIRTUAL_CANVAS_WIDTH, Math.round(x)));
}

export function clampVirtualY(y: number): number {
  return Math.max(0, Math.min(VIRTUAL_CANVAS_HEIGHT, Math.round(y)));
}

export function parseSlideGuias(raw: unknown): SlideGuias {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_SLIDE_GUIAS };
  }
  const o = raw as Record<string, unknown>;
  const horizontales = Array.isArray(o.horizontales)
    ? o.horizontales
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
        .map(clampVirtualY)
    : [];
  const verticales = Array.isArray(o.verticales)
    ? o.verticales
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
        .map(clampVirtualX)
    : [];
  return { horizontales, verticales };
}

export function clientToVirtual(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  return {
    x: clampVirtualX(((clientX - rect.left) / rect.width) * VIRTUAL_CANVAS_WIDTH),
    y: clampVirtualY(((clientY - rect.top) / rect.height) * VIRTUAL_CANVAS_HEIGHT),
  };
}

export function isPointerInsideCanvas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): boolean {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export function virtualXToPercent(x: number): number {
  return (x / VIRTUAL_CANVAS_WIDTH) * 100;
}

export function virtualYToPercent(y: number): number {
  return (y / VIRTUAL_CANVAS_HEIGHT) * 100;
}

export function rulerMarksX(): number[] {
  const out: number[] = [];
  for (let px = 0; px <= VIRTUAL_CANVAS_WIDTH; px += 100) out.push(px);
  return out;
}

export function rulerMarksY(): number[] {
  const out: number[] = [];
  for (let px = 0; px <= VIRTUAL_CANVAS_HEIGHT; px += 100) out.push(px);
  return out;
}

export const CENTER_GUIDE_X = VIRTUAL_CANVAS_WIDTH / 2;
export const CENTER_GUIDE_Y = VIRTUAL_CANVAS_HEIGHT / 2;

/** Añade las guías centrales o las quita si ya están las dos. */
export function toggleCenterGuides(guias: SlideGuias): SlideGuias {
  const hasV = guias.verticales.includes(CENTER_GUIDE_X);
  const hasH = guias.horizontales.includes(CENTER_GUIDE_Y);
  if (hasV && hasH) {
    return {
      verticales: guias.verticales.filter((x) => x !== CENTER_GUIDE_X),
      horizontales: guias.horizontales.filter((y) => y !== CENTER_GUIDE_Y),
    };
  }
  return {
    verticales: hasV ? guias.verticales : [...guias.verticales, CENTER_GUIDE_X],
    horizontales: hasH ? guias.horizontales : [...guias.horizontales, CENTER_GUIDE_Y],
  };
}
