import type { WidgetSlideCount } from '@/types/widget.types';

/** Campos de un bloque suficientes para un id estable entre lecturas (sin UUID aleatorio). */
export type WidgetIdentity = {
  tipo: string;
  id?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
};

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

export function clampWidgetSlideCount(
  value: unknown,
  fallback: WidgetSlideCount = 3,
): WidgetSlideCount {
  return clampInt(value, 2, 6, fallback) as WidgetSlideCount;
}

export function widgetStableRoot(block: WidgetIdentity): string {
  if (typeof block.id === 'string' && block.id.length > 0) return block.id;
  return `${block.tipo}:${Number(block.x ?? 0)}:${Number(block.y ?? 0)}:${Number(block.ancho ?? 0)}:${Number(block.alto ?? 0)}`;
}

/** Id determinista para hijos generados al hidratar (fichas, tarjetas, nodos). */
export function stableWidgetChildId(block: WidgetIdentity, kind: string, index: number): string {
  return `${widgetStableRoot(block)}:${kind}:${index}`;
}

/**
 * Índice inicial del visor (alumno). Ignora el índice persistido del docente
 * (`fichaActiva` / `slideActivo`).
 */
export function initialWidgetViewerPageIndex(_persistedActive?: number): number {
  return 0;
}
