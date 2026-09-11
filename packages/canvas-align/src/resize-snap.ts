// Snap de tamaño al redimensionar — capacidad nueva de la Etapa G (hoy
// `handleResizeMove` imanta la posición pero devuelve ancho/alto sin tocar).
// Iguala ancho/alto a los de un vecino o a fracciones del lienzo.

import type { BlockPos } from '@lumina/editor-shared/block-pos';
import { snapThresholdPct } from './snap.js';

export interface SizeSnapMatch {
  axis: 'ancho' | 'alto';
  /** Índice en `peerSizes` del vecino cuyo tamaño se igualó, o -1 si fue el lienzo. */
  peerIndex: number;
  /** Valor final (%). */
  value: number;
}

export interface ResizeSnapResult {
  ancho: number;
  alto: number;
  matches: SizeSnapMatch[];
}

/** Fracciones del lienzo a las que también imanta el tamaño (25 / 33.3 / 50 / 100 %). */
const CANVAS_SIZE_TARGETS = [25, 100 / 3, 50, 200 / 3, 100];

function snapAxisSize(
  raw: number,
  peerSizes: number[],
  thresholdPct: number,
): { value: number; peerIndex: number } | null {
  let best: { value: number; peerIndex: number } | null = null;
  let bestDist = thresholdPct + 1;

  peerSizes.forEach((size, i) => {
    const d = Math.abs(raw - size);
    if (d <= thresholdPct && d < bestDist) {
      bestDist = d;
      best = { value: size, peerIndex: i };
    }
  });
  for (const t of CANVAS_SIZE_TARGETS) {
    const d = Math.abs(raw - t);
    if (d <= thresholdPct && d < bestDist) {
      bestDist = d;
      best = { value: t, peerIndex: -1 };
    }
  }
  return best;
}

/**
 * Imanta `rawAncho`/`rawAlto` (en % del lienzo) al tamaño de un vecino o a una
 * fracción del lienzo. `zoom` estrecha el umbral igual que en el snap de posición.
 */
export function snapResizeSize(
  rawAncho: number,
  rawAlto: number,
  peers: BlockPos[],
  opts?: { zoom?: number; enabled?: boolean },
): ResizeSnapResult {
  if (opts?.enabled === false) {
    return { ancho: rawAncho, alto: rawAlto, matches: [] };
  }
  const zoom = opts?.zoom ?? 1;
  const hitW = snapAxisSize(
    rawAncho,
    peers.map((p) => p.ancho),
    snapThresholdPct('x', zoom),
  );
  const hitH = snapAxisSize(
    rawAlto,
    peers.map((p) => p.alto),
    snapThresholdPct('y', zoom),
  );

  const matches: SizeSnapMatch[] = [];
  if (hitW) matches.push({ axis: 'ancho', peerIndex: hitW.peerIndex, value: hitW.value });
  if (hitH) matches.push({ axis: 'alto', peerIndex: hitH.peerIndex, value: hitH.value });

  return {
    ancho: hitW?.value ?? rawAncho,
    alto: hitH?.value ?? rawAlto,
    matches,
  };
}
