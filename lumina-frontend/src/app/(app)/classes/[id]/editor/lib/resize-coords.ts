import { clampDragCorner } from '@/hooks/use-block-drag';

import { DEFAULT_BLOCK_RESIZE_MIN_DIM } from './block-resize-min-dim';

export type ResizeHandleDir = 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W';

export interface ResizeRect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

function isCornerHandle(dir: ResizeHandleDir): dir is 'NW' | 'NE' | 'SE' | 'SW' {
  return dir === 'NW' || dir === 'NE' || dir === 'SE' || dir === 'SW';
}

/** Solo aplica minDim si el usuario cambió esa dimensión (evita 4→5 en click-release). */
function applyMinDimClamp(
  dir: ResizeHandleDir,
  orig: ResizeRect,
  rect: ResizeRect,
  minDim: number,
): ResizeRect {
  let { x, y, ancho, alto } = rect;

  if (ancho < minDim && ancho !== orig.ancho) {
    if (dir === 'W' || dir === 'NW' || dir === 'SW') {
      x = orig.x + orig.ancho - minDim;
    }
    ancho = minDim;
  }

  if (alto < minDim && alto !== orig.alto) {
    if (dir === 'N' || dir === 'NW' || dir === 'NE') {
      y = orig.y + orig.alto - minDim;
    }
    alto = minDim;
  }

  return { x, y, ancho, alto };
}

/**
 * Tras clampDragCorner, recalcula ancho/alto para mantener fijo el borde opuesto
 * al handle activo (M7).
 */
export function preserveEdgeAfterClamp(
  dir: ResizeHandleDir,
  before: ResizeRect,
  after: ResizeRect,
  minDim: number,
): ResizeRect {
  let { x, y, ancho, alto } = after;

  const westFixed = dir === 'E' || dir === 'NE' || dir === 'SE';
  const eastFixed = dir === 'W' || dir === 'NW' || dir === 'SW';
  const northFixed = dir === 'S' || dir === 'SE' || dir === 'SW';
  const southFixed = dir === 'N' || dir === 'NE' || dir === 'NW';

  if (x !== before.x) {
    if (eastFixed) {
      ancho = Math.max(minDim, before.x + before.ancho - x);
    } else if (westFixed) {
      const east = after.x + after.ancho;
      x = before.x;
      ancho = Math.max(minDim, east - x);
    }
  }

  if (y !== before.y) {
    if (southFixed) {
      alto = Math.max(minDim, before.y + before.alto - y);
    } else if (northFixed) {
      const south = after.y + after.alto;
      y = before.y;
      alto = Math.max(minDim, south - y);
    }
  }

  return { x, y, ancho, alto };
}

function finalizeCoords(dir: ResizeHandleDir, before: ResizeRect, rect: ResizeRect, minDim: number): ResizeRect {
  const clamped = clampDragCorner(rect.x, rect.y, rect.ancho, rect.alto);
  const afterClamp: ResizeRect = { ...rect, x: clamped.x, y: clamped.y };
  const preserved = preserveEdgeAfterClamp(dir, before, afterClamp, minDim);
  const reclamped = clampDragCorner(preserved.x, preserved.y, preserved.ancho, preserved.alto);
  return { ...preserved, x: reclamped.x, y: reclamped.y };
}

export function computeNewCoords(
  dir: ResizeHandleDir,
  origX: number,
  origY: number,
  origAncho: number,
  origAlto: number,
  dxPct: number,
  dyPct: number,
  lockAspectRatio = false,
  minDim = DEFAULT_BLOCK_RESIZE_MIN_DIM,
): ResizeRect {
  const orig: ResizeRect = { x: origX, y: origY, ancho: origAncho, alto: origAlto };

  if (lockAspectRatio && isCornerHandle(dir) && origAncho > 0 && origAlto > 0) {
    const ratio = origAncho / origAlto;
    const anchorX = origX + origAncho;
    const anchorY = origY + origAlto;

    const widthDelta = dir === 'SE' || dir === 'NE' ? dxPct : -dxPct;
    const heightDelta = dir === 'SE' || dir === 'SW' ? dyPct : -dyPct;

    let ancho = origAncho + widthDelta;
    let alto = origAlto + heightDelta;

    if (Math.abs(widthDelta) >= Math.abs(heightDelta) * ratio) {
      alto = ancho / ratio;
    } else {
      ancho = alto * ratio;
    }

    if (ancho < minDim && ancho !== origAncho) {
      ancho = minDim;
      alto = ancho / ratio;
    }
    if (alto < minDim && alto !== origAlto) {
      alto = minDim;
      ancho = alto * ratio;
    }

    let x = origX;
    let y = origY;

    if (dir === 'NW' || dir === 'SW') x = anchorX - ancho;
    if (dir === 'NW' || dir === 'NE') y = anchorY - alto;

    const beforeCorner: ResizeRect = { x, y, ancho, alto };
    return finalizeCoords(dir, beforeCorner, beforeCorner, minDim);
  }

  let rect: ResizeRect = { ...orig };

  switch (dir) {
    case 'E':
      rect.ancho = origAncho + dxPct;
      break;
    case 'W':
      rect.x = origX + dxPct;
      rect.ancho = origAncho - dxPct;
      break;
    case 'S':
      rect.alto = origAlto + dyPct;
      break;
    case 'N':
      rect.y = origY + dyPct;
      rect.alto = origAlto - dyPct;
      break;
    case 'SE':
      rect.ancho = origAncho + dxPct;
      rect.alto = origAlto + dyPct;
      break;
    case 'SW':
      rect.x = origX + dxPct;
      rect.ancho = origAncho - dxPct;
      rect.alto = origAlto + dyPct;
      break;
    case 'NE':
      rect.y = origY + dyPct;
      rect.alto = origAlto - dyPct;
      rect.ancho = origAncho + dxPct;
      break;
    case 'NW':
      rect.x = origX + dxPct;
      rect.ancho = origAncho - dxPct;
      rect.y = origY + dyPct;
      rect.alto = origAlto - dyPct;
      break;
  }

  const beforeMin = { ...rect };
  rect = applyMinDimClamp(dir, orig, rect, minDim);
  return finalizeCoords(dir, beforeMin, rect, minDim);
}
