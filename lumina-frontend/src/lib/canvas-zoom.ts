export const CANVAS_ZOOM_MIN = 0.5;
export const CANVAS_ZOOM_MAX = 2;
export const CANVAS_ZOOM_STEP = 0.1;
export const CANVAS_ZOOM_DEFAULT = 1;
export const CANVAS_ZOOM_STORAGE_KEY = 'lumina-editor-canvas-zoom';

export function clampCanvasZoom(z: number): number {
  if (!Number.isFinite(z)) return CANVAS_ZOOM_DEFAULT;
  return Math.min(
    CANVAS_ZOOM_MAX,
    Math.max(CANVAS_ZOOM_MIN, Math.round(z * 100) / 100),
  );
}

export function stepCanvasZoom(current: number, delta: number): number {
  return clampCanvasZoom(current + delta);
}

export function wheelDeltaToZoomStep(deltaY: number): number {
  const direction = deltaY > 0 ? -1 : 1;
  return direction * CANVAS_ZOOM_STEP;
}

export function formatCanvasZoom(z: number): string {
  return `${Math.round(clampCanvasZoom(z) * 100)}%`;
}

export function readStoredCanvasZoom(): number {
  if (typeof window === 'undefined') return CANVAS_ZOOM_DEFAULT;
  try {
    const raw = window.localStorage.getItem(CANVAS_ZOOM_STORAGE_KEY);
    if (raw == null) return CANVAS_ZOOM_DEFAULT;
    return clampCanvasZoom(Number(raw));
  } catch {
    return CANVAS_ZOOM_DEFAULT;
  }
}

export function writeStoredCanvasZoom(z: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CANVAS_ZOOM_STORAGE_KEY, String(clampCanvasZoom(z)));
  } catch {
    /* ignore quota / private mode */
  }
}
