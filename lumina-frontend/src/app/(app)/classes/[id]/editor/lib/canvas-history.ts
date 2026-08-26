import type { Background, Block, SlideGuias } from '@/types/slide.types';
import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';
import type { TransicionSlide } from '@/types/animation.types';

/**
 * Historial de edición del lienzo (Ctrl+Z / saltar a snapshot).
 *
 * Política al cambiar de slide: **se conserva por `slideId`** en un Map en
 * memoria de sesión (`CanvasArea`). No se limpia al salir de la diapositiva.
 *
 * Motivo: el docente suele cambiar de slide para consultar y volver; perder
 * el deshacer en ese caso es peor que el coste de ≤ MAX_UNDO snapshots por
 * slide. Se descarta al desmontar el editor (salir de la ruta), no al
 * cambiar de slide. No se persiste en servidor: eso es el Sheet «Historial
 * de versiones» (Ctrl+S), un sistema distinto.
 */
export const MAX_UNDO = 20;

export type HistoryKind = 'inicio' | 'edicion' | 'fondo' | 'guias' | 'pegar' | 'eliminar';

export const HISTORY_LABELS: Record<HistoryKind, string> = {
  inicio: 'Inicio',
  edicion: 'Edición',
  fondo: 'Fondo',
  guias: 'Guías',
  pegar: 'Pegar',
  eliminar: 'Eliminar',
};

export interface SlideHistorySnapshot {
  kind: HistoryKind;
  at: number;
  bloques: Block[];
  fondo?: Background;
  guias: SlideGuias;
  transicion?: TransicionSlide;
}

export interface SlideHistoryState {
  entries: SlideHistorySnapshot[];
  /** Índice del snapshot restaurado / actual. */
  index: number;
}

export interface HistoryViewItem {
  index: number;
  label: string;
  at: number;
  isCurrent: boolean;
}

function cloneJson<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

/** Clon profundo para arrays de bloques (compartido con el editor). */
export function cloneSlideBlocks(bloques: Block[]): Block[] {
  return cloneJson(bloques);
}

export function captureSlideSnapshot(
  slide: {
    bloques?: Block[];
    fondo?: Background;
    guias?: SlideGuias;
    transicion?: TransicionSlide;
  },
  kind: HistoryKind,
  at = Date.now(),
): SlideHistorySnapshot {
  return {
    kind,
    at,
    bloques: cloneJson(slide.bloques ?? []),
    fondo: slide.fondo ? cloneJson(slide.fondo) : undefined,
    guias: cloneJson(slide.guias ?? EMPTY_SLIDE_GUIAS),
    ...(slide.transicion !== undefined
      ? { transicion: cloneJson(slide.transicion) }
      : {}),
  };
}

export function createInitialHistory(
  snapshot: SlideHistorySnapshot,
): SlideHistoryState {
  return {
    entries: [cloneJson(snapshot)],
    index: 0,
  };
}

export function canUndoHistory(state: SlideHistoryState): boolean {
  return state.index > 0;
}

export function canRedoHistory(state: SlideHistoryState): boolean {
  return state.index < state.entries.length - 1;
}

/**
 * Añade un snapshot en la punta. Descarta la rama de rehacer (todo lo que
 * estaba después de `index`) y recorta a `maxEntries` (incluye el actual).
 * El snapshot en índice 0 («Inicio») se conserva siempre.
 */
export function pushHistoryEntry(
  state: SlideHistoryState,
  snapshot: SlideHistorySnapshot,
  maxEntries = MAX_UNDO,
): SlideHistoryState {
  const kept = state.entries.slice(0, state.index + 1);
  kept.push(cloneJson(snapshot));

  if (kept.length <= maxEntries) {
    return { entries: kept, index: kept.length - 1 };
  }

  const anchor = kept[0]!;
  const tail = kept.slice(1);
  const maxTail = Math.max(0, maxEntries - 1);
  const trimmedTail =
    tail.length > maxTail ? tail.slice(tail.length - maxTail) : tail;
  const sliced = [anchor, ...trimmedTail];
  return { entries: sliced, index: sliced.length - 1 };
}

/** Reinicia la pila de undo del slide (p. ej. tras restaurar una versión del servidor). */
export function resetSlideHistory(
  snapshot: SlideHistorySnapshot,
): SlideHistoryState {
  return createInitialHistory({ ...snapshot, kind: 'inicio' });
}

export function undoHistory(
  state: SlideHistoryState,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  if (!canUndoHistory(state)) return null;
  const index = state.index - 1;
  const snapshot = state.entries[index];
  if (!snapshot) return null;
  return { state: { entries: state.entries, index }, snapshot };
}

export function redoHistory(
  state: SlideHistoryState,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  if (!canRedoHistory(state)) return null;
  const index = state.index + 1;
  const snapshot = state.entries[index];
  if (!snapshot) return null;
  return { state: { entries: state.entries, index }, snapshot };
}

export function jumpHistory(
  state: SlideHistoryState,
  index: number,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  if (index < 0 || index >= state.entries.length) return null;
  if (index === state.index) return null;
  const snapshot = state.entries[index];
  if (!snapshot) return null;
  return { state: { entries: state.entries, index }, snapshot };
}

/** Más reciente primero, para el dropdown. */
export function historyViewItems(state: SlideHistoryState): HistoryViewItem[] {
  const items: HistoryViewItem[] = [];
  for (let i = state.entries.length - 1; i >= 0; i--) {
    const entry = state.entries[i];
    if (!entry) continue;
    items.push({
      index: i,
      label: HISTORY_LABELS[entry.kind],
      at: entry.at,
      isCurrent: i === state.index,
    });
  }
  return items;
}

export function formatHistoryWhen(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - at) / 1000));
  if (s < 5) return 'ahora';
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return 'hace más de 1 día';
}
