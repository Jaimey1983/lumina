import type { TransicionSlide } from '@/types/animation.types';
import type { Background, Block, SlideGuias } from '@/types/slide.types';
import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';

import {
  applySlideBlockPatch,
  diffSlideBlocks,
  type SlideBlockPatch,
} from './slide-block-patch';

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

type ValuePatch<T> = { op: 'set'; value?: T };

export interface SlideSnapshotPatch {
  bloques: SlideBlockPatch;
  fondo?: ValuePatch<Background>;
  guias?: ValuePatch<SlideGuias>;
  transicion?: ValuePatch<TransicionSlide>;
}

export interface SlideHistoryInitialEntry extends SlideHistorySnapshot {
  kind: 'inicio';
}

export interface SlideHistoryPatchEntry {
  kind: Exclude<HistoryKind, 'inicio'>;
  at: number;
  forwardPatch: SlideSnapshotPatch;
  inversePatch: SlideSnapshotPatch;
}

export type SlideHistoryEntry = SlideHistoryInitialEntry | SlideHistoryPatchEntry;

export interface SlideHistoryState {
  entries: SlideHistoryEntry[];
  /** Índice del punto restaurado / actual. */
  index: number;
}

export interface HistoryViewItem {
  index: number;
  label: string;
  at: number;
  isCurrent: boolean;
}

function cloneJson<T>(value: T): T {
  if (value === undefined) return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]));
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]))
  );
}

function valuePatch<T>(previous: T | undefined, next: T | undefined): ValuePatch<T> | undefined {
  return deepEqual(previous, next) ? undefined : { op: 'set', value: cloneJson(next) };
}

export function diffSlideSnapshots(
  previous: SlideHistorySnapshot,
  next: SlideHistorySnapshot,
): SlideSnapshotPatch {
  const fondo = valuePatch(previous.fondo, next.fondo);
  const guias = valuePatch(previous.guias, next.guias);
  const transicion = valuePatch(previous.transicion, next.transicion);
  return {
    bloques: diffSlideBlocks(previous.bloques, next.bloques),
    ...(fondo ? { fondo } : {}),
    ...(guias ? { guias } : {}),
    ...(transicion ? { transicion } : {}),
  };
}

/** Aplica un patch sin mutar snapshot ni bloques de entrada. */
export function applySnapshot(
  snapshot: SlideHistorySnapshot,
  patch: SlideSnapshotPatch,
  meta?: { kind?: HistoryKind; at?: number },
): SlideHistorySnapshot {
  const fondo = patch.fondo ? cloneJson(patch.fondo.value) : snapshot.fondo;
  const guias = patch.guias
    ? cloneJson(patch.guias.value ?? EMPTY_SLIDE_GUIAS)
    : snapshot.guias;
  const transicion = patch.transicion
    ? cloneJson(patch.transicion.value)
    : snapshot.transicion;
  return {
    kind: meta?.kind ?? snapshot.kind,
    at: meta?.at ?? snapshot.at,
    bloques: applySlideBlockPatch(snapshot.bloques, patch.bloques),
    ...(fondo !== undefined ? { fondo } : {}),
    guias,
    ...(transicion !== undefined ? { transicion } : {}),
  };
}

/** Clon profundo para arrays de bloques (compatibilidad con el editor). */
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

function asInitial(snapshot: SlideHistorySnapshot): SlideHistoryInitialEntry {
  return { ...cloneJson(snapshot), kind: 'inicio' };
}

export function createInitialHistory(snapshot: SlideHistorySnapshot): SlideHistoryState {
  return { entries: [asInitial(snapshot)], index: 0 };
}

export function canUndoHistory(state: SlideHistoryState): boolean {
  return state.index > 0;
}

export function canRedoHistory(state: SlideHistoryState): boolean {
  return state.index < state.entries.length - 1;
}

function createPatchEntry(
  previous: SlideHistorySnapshot,
  next: SlideHistorySnapshot,
): SlideHistoryPatchEntry {
  return {
    kind: next.kind === 'inicio' ? 'edicion' : next.kind,
    at: next.at,
    forwardPatch: diffSlideSnapshots(previous, next),
    inversePatch: diffSlideSnapshots(next, previous),
  };
}

/** Materializa un punto desde el único snapshot completo («Inicio») y sus diffs. */
export function materializeHistorySnapshot(
  state: SlideHistoryState,
  index = state.index,
): SlideHistorySnapshot | null {
  const initial = state.entries[0];
  if (!initial || initial.kind !== 'inicio' || index < 0 || index >= state.entries.length) {
    return null;
  }
  let snapshot: SlideHistorySnapshot = cloneJson(initial);
  for (let cursor = 1; cursor <= index; cursor += 1) {
    const entry = state.entries[cursor];
    if (!entry || entry.kind === 'inicio') return null;
    snapshot = applySnapshot(snapshot, entry.forwardPatch, {
      kind: entry.kind,
      at: entry.at,
    });
  }
  return snapshot;
}

/**
 * Añade un diff en la punta, descarta redo y conserva «Inicio». Al recortar,
 * el primer diff retenido se rebasa contra Inicio para mantener la semántica
 * visible anterior sin introducir otro snapshot completo.
 */
export function pushHistoryEntry(
  state: SlideHistoryState,
  snapshot: SlideHistorySnapshot,
  maxEntries = MAX_UNDO,
): SlideHistoryState {
  const current = materializeHistorySnapshot(state);
  if (!current) return createInitialHistory(snapshot);
  const kept = state.entries.slice(0, state.index + 1);
  kept.push(createPatchEntry(current, snapshot));
  if (kept.length <= maxEntries) return { entries: kept, index: kept.length - 1 };

  const maxTail = Math.max(0, maxEntries - 1);
  if (maxTail === 0) {
    const initial = kept[0];
    return initial && initial.kind === 'inicio'
      ? { entries: [initial], index: 0 }
      : createInitialHistory(snapshot);
  }
  const firstKeptIndex = kept.length - maxTail;
  const untrimmed: SlideHistoryState = { entries: kept, index: kept.length - 1 };
  const firstKeptSnapshot = materializeHistorySnapshot(untrimmed, firstKeptIndex);
  const initial = kept[0];
  if (!firstKeptSnapshot || !initial || initial.kind !== 'inicio') {
    return createInitialHistory(snapshot);
  }
  const tail = kept.slice(firstKeptIndex);
  const rebased = createPatchEntry(initial, firstKeptSnapshot);
  const entries: SlideHistoryEntry[] = [initial, rebased, ...tail.slice(1)];
  return { entries, index: entries.length - 1 };
}

export function resetSlideHistory(snapshot: SlideHistorySnapshot): SlideHistoryState {
  return createInitialHistory({ ...snapshot, kind: 'inicio' });
}

function historyResult(
  state: SlideHistoryState,
  index: number,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  if (index < 0 || index >= state.entries.length) return null;
  let snapshot = materializeHistorySnapshot(state);
  if (!snapshot) return null;

  if (index < state.index) {
    for (let cursor = state.index; cursor > index; cursor -= 1) {
      const entry = state.entries[cursor];
      const previousEntry = state.entries[cursor - 1];
      if (!entry || entry.kind === 'inicio' || !previousEntry) return null;
      snapshot = applySnapshot(snapshot, entry.inversePatch, {
        kind: previousEntry.kind,
        at: previousEntry.at,
      });
    }
  } else {
    for (let cursor = state.index + 1; cursor <= index; cursor += 1) {
      const entry = state.entries[cursor];
      if (!entry || entry.kind === 'inicio') return null;
      snapshot = applySnapshot(snapshot, entry.forwardPatch, {
        kind: entry.kind,
        at: entry.at,
      });
    }
  }
  return { state: { entries: state.entries, index }, snapshot };
}

export function undoHistory(
  state: SlideHistoryState,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  return canUndoHistory(state) ? historyResult(state, state.index - 1) : null;
}

export function redoHistory(
  state: SlideHistoryState,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  return canRedoHistory(state) ? historyResult(state, state.index + 1) : null;
}

export function jumpHistory(
  state: SlideHistoryState,
  index: number,
): { state: SlideHistoryState; snapshot: SlideHistorySnapshot } | null {
  if (index === state.index) return null;
  return historyResult(state, index);
}

/** Más reciente primero, para el dropdown. */
export function historyViewItems(state: SlideHistoryState): HistoryViewItem[] {
  const items: HistoryViewItem[] = [];
  for (let index = state.entries.length - 1; index >= 0; index -= 1) {
    const entry = state.entries[index];
    if (!entry) continue;
    items.push({
      index,
      label: HISTORY_LABELS[entry.kind],
      at: entry.at,
      isCurrent: index === state.index,
    });
  }
  return items;
}

export function formatHistoryWhen(at: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 5) return 'ahora';
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return 'hace más de 1 día';
}
