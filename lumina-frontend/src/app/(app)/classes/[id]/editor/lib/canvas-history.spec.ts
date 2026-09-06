import { describe, expect, it } from 'vitest';

import type { Block } from '@/types/slide.types';

import {
  MAX_UNDO,
  canRedoHistory,
  canUndoHistory,
  captureSlideSnapshot,
  createInitialHistory,
  formatHistoryWhen,
  historyViewItems,
  jumpHistory,
  materializeHistorySnapshot,
  pushHistoryEntry,
  redoHistory,
  resetSlideHistory,
  undoHistory,
} from './canvas-history';

function bloques(n: number): Block[] {
  return [
    {
      tipo: 'texto',
      contenido: `b${n}`,
      x: n,
      y: n,
      ancho: 20,
      alto: 10,
    },
  ];
}

function snap(n: number, kind: 'inicio' | 'edicion' | 'pegar' = 'edicion') {
  return captureSlideSnapshot(
    { bloques: bloques(n), fondo: { tipo: 'color', valor: `#${n}${n}${n}` } },
    kind,
    1_000 + n,
  );
}

describe('canvas-history', () => {
  it('createInitialHistory arranca en índice 0 sin undo', () => {
    const state = createInitialHistory(snap(0, 'inicio'));
    expect(state.index).toBe(0);
    expect(state.entries).toHaveLength(1);
    expect(canUndoHistory(state)).toBe(false);
    expect(canRedoHistory(state)).toBe(false);
  });

  it('push recorta la rama de rehacer y mueve el índice a la punta', () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    state = pushHistoryEntry(state, snap(1));
    state = pushHistoryEntry(state, snap(2));
    const undone = undoHistory(state);
    expect(undone).not.toBeNull();
    state = undone!.state;
    expect(state.index).toBe(1);
    expect(canRedoHistory(state)).toBe(true);

    state = pushHistoryEntry(state, snap(9, 'pegar'));
    expect(state.entries).toHaveLength(3);
    expect(state.index).toBe(2);
    expect(canRedoHistory(state)).toBe(false);
    expect(state.entries[2]?.kind).toBe('pegar');
  });

  it('acepta el kind eliminar en un snapshot', () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    state = pushHistoryEntry(
      state,
      captureSlideSnapshot(
        { bloques: bloques(1), fondo: { tipo: 'color', valor: '#111' } },
        'eliminar',
        1_001,
      ),
    );
    expect(state.entries[1]?.kind).toBe('eliminar');
    expect(canUndoHistory(state)).toBe(true);
  });

  it(`respeta MAX_UNDO=${MAX_UNDO} conservando el snapshot «Inicio» en índice 0`, () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    for (let i = 1; i <= MAX_UNDO + 5; i++) {
      state = pushHistoryEntry(state, snap(i));
    }
    expect(state.entries).toHaveLength(MAX_UNDO);
    expect(state.index).toBe(MAX_UNDO - 1);
    expect(state.entries[0]?.kind).toBe('inicio');
    expect(materializeHistorySnapshot(state, 0)?.bloques[0]).toMatchObject({
      contenido: 'b0',
    });
    expect(materializeHistorySnapshot(state)?.bloques[0]).toMatchObject({
      contenido: `b${MAX_UNDO + 5}`,
    });
  });

  it('undo / redo restauran el snapshot sin mutar el array de entries', () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    state = pushHistoryEntry(state, snap(1));
    const entriesRef = state.entries;

    const u = undoHistory(state);
    expect(u?.snapshot.bloques[0]).toMatchObject({ contenido: 'b0' });
    expect(u?.state.entries).toBe(entriesRef);

    const r = redoHistory(u!.state);
    expect(r?.snapshot.bloques[0]).toMatchObject({ contenido: 'b1' });
    expect(r?.state.index).toBe(1);
  });

  it('jumpHistory salta a un índice y no-op si ya estamos ahí', () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    state = pushHistoryEntry(state, snap(1));
    state = pushHistoryEntry(state, snap(2));

    const jumped = jumpHistory(state, 0);
    expect(jumped?.state.index).toBe(0);
    expect(jumped?.snapshot.bloques[0]).toMatchObject({ contenido: 'b0' });
    expect(jumpHistory(jumped!.state, 0)).toBeNull();
    expect(jumpHistory(state, 99)).toBeNull();
  });

  it('preserva marco de una actividad (C3) al clonar el snapshot', () => {
    const activity = {
      tipo: 'actividad' as const,
      actividad: {
        tipo: 'quiz_multiple' as const,
        preguntas: [{ id: 'q-1', texto: '¿?', opciones: [] }],
        deliveryMode: 'AUTONOMOUS' as const,
        layoutVariant: 'classic-list' as const,
      },
      marco: {
        izquierdaPct: 8,
        arribaPct: 10,
        anchoPct: 70,
        altoPct: 60,
      },
    };
    const snapshot = captureSlideSnapshot({ bloques: [activity as Block] }, 'edicion');
    const cloned = snapshot.bloques[0] as Extract<Block, { tipo: 'actividad' }>;
    expect(cloned.tipo).toBe('actividad');
    expect(cloned.marco).toEqual({
      izquierdaPct: 8,
      arribaPct: 10,
      anchoPct: 70,
      altoPct: 60,
    });
    expect(cloned).not.toHaveProperty('x');
    expect(cloned).not.toHaveProperty('ancho');
  });

  it('historyViewItems lista de más reciente a más antiguo', () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    state = pushHistoryEntry(state, snap(1));
    const items = historyViewItems(state);
    expect(items.map((i) => i.index)).toEqual([1, 0]);
    expect(items[0]).toMatchObject({ label: 'Edición', isCurrent: true });
    expect(items[1]).toMatchObject({ label: 'Inicio', isCurrent: false });
  });

  it('formatHistoryWhen usa umbrales relativos', () => {
    const now = 1_000_000;
    expect(formatHistoryWhen(now - 2_000, now)).toBe('ahora');
    expect(formatHistoryWhen(now - 12_000, now)).toBe('hace 12 s');
    expect(formatHistoryWhen(now - 3 * 60_000, now)).toBe('hace 3 min');
    expect(formatHistoryWhen(now - 2 * 3_600_000, now)).toBe('hace 2 h');
    expect(formatHistoryWhen(now - 48 * 3_600_000, now)).toBe('hace más de 1 día');
  });

  it('resetSlideHistory deja una sola entrada «Inicio» sin undo', () => {
    let state = createInitialHistory(snap(0, 'inicio'));
    state = pushHistoryEntry(state, snap(1));
    state = pushHistoryEntry(state, snap(2));
    expect(state.entries).toHaveLength(3);
    const fresh = resetSlideHistory(snap(9, 'inicio'));
    expect(fresh.entries).toHaveLength(1);
    expect(fresh.index).toBe(0);
    expect(fresh.entries[0]?.kind).toBe('inicio');
    expect(materializeHistorySnapshot(fresh)?.bloques[0]).toMatchObject({
      contenido: 'b9',
    });
    expect(canUndoHistory(fresh)).toBe(false);
  });

  it('captureSlideSnapshot incluye transicion cuando se proporciona', () => {
    const transicion = { tipo: 'fade' as const, duracion: 500 };
    const snapshot = captureSlideSnapshot({ bloques: bloques(1), transicion }, 'edicion');
    expect(snapshot.transicion).toEqual(transicion);
  });

  it('mantiene paridad visible en mover, pegar, fondo, eliminar y guías', () => {
    const a = bloques(1)[0]!;
    const b = bloques(2)[0]!;
    const pasted = { ...bloques(3)[0]!, contenido: 'pegado' } as Block;
    const inicio = captureSlideSnapshot(
      {
        bloques: [a, b],
        fondo: { tipo: 'color', valor: '#fff' },
        guias: { verticales: [], horizontales: [], grilla: { activa: false, tamanoPx: 20 } },
      },
      'inicio',
      1,
    );
    const moved = captureSlideSnapshot(
      { ...inicio, bloques: [{ ...a, x: 55 } as Block, b] },
      'edicion',
      2,
    );
    const pastedState = captureSlideSnapshot(
      { ...moved, bloques: [...moved.bloques, pasted] },
      'pegar',
      3,
    );
    const background = captureSlideSnapshot(
      { ...pastedState, fondo: { tipo: 'color', valor: '#123456' } },
      'fondo',
      4,
    );
    const deleted = captureSlideSnapshot(
      { ...background, bloques: [background.bloques[0]!, pasted] },
      'eliminar',
      5,
    );
    const guided = captureSlideSnapshot(
      {
        ...deleted,
        guias: {
          verticales: [640],
          horizontales: [360],
          grilla: { activa: true, tamanoPx: 40 },
        },
      },
      'guias',
      6,
    );

    let state = createInitialHistory(inicio);
    for (const snapshot of [moved, pastedState, background, deleted, guided]) {
      state = pushHistoryEntry(state, snapshot);
    }

    const visible = (snapshot: typeof inicio) => ({
      bloques: snapshot.bloques,
      fondo: snapshot.fondo,
      guias: snapshot.guias,
    });
    expect(visible(materializeHistorySnapshot(state)!)).toEqual(visible(guided));
    expect(visible(jumpHistory(state, 2)!.snapshot)).toEqual(visible(pastedState));
    expect(visible(undoHistory(state)!.snapshot)).toEqual(visible(deleted));
    expect(visible(redoHistory(undoHistory(state)!.state)!.snapshot)).toEqual(
      visible(guided),
    );
  });

  it('almacena forward/inverse patch más chico que un Block[] completo', () => {
    const manyBlocks = Array.from({ length: 25 }, (_, index) => ({
      ...bloques(index)[0]!,
      contenido: `bloque-${index}-${'contenido-largo-'.repeat(20)}`,
    })) as Block[];
    const movedBlocks = manyBlocks.map((block, index) =>
      index === 12 ? ({ ...block, x: 77 } as Block) : block,
    );
    let state = createInitialHistory(
      captureSlideSnapshot({ bloques: manyBlocks }, 'inicio', 1),
    );
    state = pushHistoryEntry(
      state,
      captureSlideSnapshot({ bloques: movedBlocks }, 'edicion', 2),
    );

    const entry = state.entries[1]!;
    expect('forwardPatch' in entry).toBe(true);
    expect(entry).not.toHaveProperty('bloques');
    expect(JSON.stringify(entry).length).toBeLessThan(
      JSON.stringify(movedBlocks).length,
    );
  });
});
