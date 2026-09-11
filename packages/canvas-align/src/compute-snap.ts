// computeSnap() — entrada única de la Etapa G: funde el imán de posición
// (snap.ts), los huecos iguales (spacing.ts) y las cotas de distancia
// (measurements.ts) en una sola pasada, con OBB (rotación) y umbral f(zoom).
// El render lo consume <AlignmentOverlay> (G1); el lienzo lo cablea G2.

import type { Block, SlideGuias } from '@lumina/types/slide';
import { getBlockPos, type BlockPos } from '@lumina/editor-shared/block-pos';

import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from './virtual-canvas.js';
import { clampDragCorner } from './clamp.js';
import { snapPositionToGuides, type SnapLine } from './snap.js';
import { aabbOfRotatedRect, type AlignRect } from './obb.js';
import { computeMeasurements, type Measurement } from './measurements.js';

/** Rotación (grados) de un bloque — `marco.rotacion` en actividades. */
export function blockRotation(block: Block): number {
  if (block.tipo === 'actividad') return block.marco?.rotacion ?? 0;
  return (block as { rotacion?: number }).rotacion ?? 0;
}

export interface ComputeSnapContext {
  guias?: SlideGuias | null;
  /** false = Alt u otro modificador: coords crudas, sin líneas ni cotas. */
  enabled?: boolean;
  /** Zoom del lienzo (1 = 100 %). Mantiene el umbral constante en px de pantalla. */
  zoom?: number;
  /** Rotación del bloque activo, en grados. El snap opera sobre su AABB. */
  rotacionDeg?: number;
  /** Omitir las cotas de distancia (p. ej. durante un resize puro). */
  skipMeasurements?: boolean;
}

export interface ComputeSnapResult {
  /** Origen sin rotar + tamaño, ya con clamp — lo que se persiste. */
  rect: { x: number; y: number; ancho: number; alto: number };
  /** Guías de alineación / hueco / grilla a dibujar. */
  guides: SnapLine[];
  /** Cotas de distancia (a bordes, a vecinos, hueco igual). */
  measurements: Measurement[];
}

/**
 * @param draggedIndex índice(s) del/los bloque(s) activo(s) en `peers` — se excluyen del cálculo.
 */
export function computeSnap(
  rawX: number,
  rawY: number,
  ancho: number,
  alto: number,
  draggedIndex: number | number[],
  peers: Block[],
  ctx?: ComputeSnapContext,
): ComputeSnapResult {
  const rot = ctx?.rotacionDeg ?? 0;
  const rawRect: AlignRect = { x: rawX, y: rawY, ancho, alto };
  const aabb = aabbOfRotatedRect(rawRect, rot);

  const {
    x: snappedAabbX,
    y: snappedAabbY,
    lines,
  } = snapPositionToGuides(
    aabb.x,
    aabb.y,
    aabb.ancho,
    aabb.alto,
    draggedIndex,
    peers,
    { guias: ctx?.guias, enabled: ctx?.enabled, zoom: ctx?.zoom },
  );

  // El AABB y la caja sin rotar comparten centro → el desplazamiento del snap
  // aplica igual al origen sin rotar.
  const dx = snappedAabbX - aabb.x;
  const dy = snappedAabbY - aabb.y;
  const { x, y } = clampDragCorner(rawX + dx, rawY + dy, ancho, alto);

  const rect = { x, y, ancho, alto };

  if (ctx?.enabled === false || ctx?.skipMeasurements) {
    return { rect, guides: lines, measurements: [] };
  }

  // Cotas: sobre lo que se ve (AABB del bloque activo ya imantado) contra los
  // AABB de los vecinos.
  const ignores = Array.isArray(draggedIndex) ? draggedIndex : [draggedIndex];
  const activeAabb = aabbOfRotatedRect({ x, y, ancho, alto }, rot);
  const activePos: BlockPos = {
    x: activeAabb.x,
    y: activeAabb.y,
    ancho: activeAabb.ancho,
    alto: activeAabb.alto,
  };
  const peerPositions: BlockPos[] = [];
  for (let i = 0; i < peers.length; i++) {
    if (ignores.includes(i)) continue;
    const p = getBlockPos(peers[i]);
    const pr = blockRotation(peers[i]);
    const pa = aabbOfRotatedRect(
      { x: p.x, y: p.y, ancho: p.ancho, alto: p.alto },
      pr,
    );
    peerPositions.push({ x: pa.x, y: pa.y, ancho: pa.ancho, alto: pa.alto });
  }

  const measurements = computeMeasurements({
    activePos,
    peerPositions,
    canvasWidth: VIRTUAL_CANVAS_WIDTH,
    canvasHeight: VIRTUAL_CANVAS_HEIGHT,
  });

  return { rect, guides: lines, measurements };
}
