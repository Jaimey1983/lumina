import { describe, expect, it } from 'vitest';

import {
  applyNudgeToBlocks,
  getBlockPos,
  withClampedPosition,
  withRect,
  withRotation,
} from '@/hooks/use-block-drag';
import type { ActivityBlock, Block, Slide } from '@/types/slide.types';
import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';

import { getBlockResizeMinDim } from './block-resize-min-dim';
import { editorSlideReducer } from './editor-slide-reducer';
import {
  createInitialEditorSlideState,
  editorBloquesOverride,
  type EditorSlideState,
} from './editor-slide-state';
import { computeNewCoords } from './resize-coords';
import { normalizeAngle } from './rotate-coords';

function texto(
  n: number,
  extra?: Partial<Extract<Block, { tipo: 'texto' }>>,
): Block {
  return {
    tipo: 'texto',
    contenido: `t${n}`,
    x: n * 10,
    y: n * 8,
    ancho: 20,
    alto: 10,
    ...extra,
  };
}

function slideCon(bloques: Block[], id = 'slide-1'): Slide {
  return {
    id,
    order: 0,
    type: 'CONTENT',
    title: 'S',
    bloques,
    fondo: { tipo: 'color', valor: '#ffffff' },
    guias: EMPTY_SLIDE_GUIAS,
  };
}

function reduce(
  start: EditorSlideState,
  ...actions: Parameters<typeof editorSlideReducer>[1][]
): EditorSlideState {
  return actions.reduce(editorSlideReducer, start);
}

describe('createInitialEditorSlideState', () => {
  it('copia bloques/fondo/guias del slide y deja la selección vacía', () => {
    const bloques = [texto(1), texto(2)];
    const state = createInitialEditorSlideState(slideCon(bloques));
    expect(state.slideId).toBe('slide-1');
    expect(state.bloques).toEqual(bloques);
    expect(state.bloques).not.toBe(bloques);
    expect(state.bloquesOptimistic).toBe(false);
    expect(editorBloquesOverride(state)).toBeNull();
    expect(state.selectedBlockId).toBeNull();
    expect(state.selectedBlockIds).toEqual([]);
    expect(state.layersPanelOpen).toBe(false);
    expect(state.fondo).toEqual({ tipo: 'color', valor: '#ffffff' });
    expect(state.guias).toEqual(EMPTY_SLIDE_GUIAS);
  });

  it('acepta slide null', () => {
    const state = createInitialEditorSlideState(null);
    expect(state.slideId).toBeNull();
    expect(state.bloques).toEqual([]);
  });
});

describe('selección', () => {
  it('SELECCIONAR fija id y selectedBlockIds', () => {
    const state = reduce(
      createInitialEditorSlideState(slideCon([texto(0)])),
      { type: 'SELECCIONAR', id: '0' },
    );
    expect(state.selectedBlockId).toBe('0');
    expect(state.selectedBlockIds).toEqual(['0']);
  });

  it('SELECCIONAR null / vacío limpia la selección', () => {
    const primed = reduce(
      createInitialEditorSlideState(slideCon([texto(0)])),
      { type: 'SELECCIONAR', id: '0' },
    );
    expect(reduce(primed, { type: 'SELECCIONAR', id: null }).selectedBlockId).toBeNull();
    expect(reduce(primed, { type: 'SELECCIONAR', id: '' }).selectedBlockIds).toEqual([]);
  });

  it('SELECCIONAR_MULTIPLE usa el último id como primario (paridad shift/marquee)', () => {
    const state = reduce(
      createInitialEditorSlideState(slideCon([texto(0), texto(1), texto(2)])),
      { type: 'SELECCIONAR_MULTIPLE', ids: ['0', '2'] },
    );
    expect(state.selectedBlockIds).toEqual(['0', '2']);
    expect(state.selectedBlockId).toBe('2');
  });

  it('cambiar de bloque limpia inner-selection (paridad canvas-area)', () => {
    let state = reduce(
      createInitialEditorSlideState(slideCon([texto(0), texto(1)])),
      { type: 'SELECCIONAR', id: '0' },
      { type: 'INNER_SELECTION', inner: { clipGroupBlockId: '0' } },
    );
    expect(state.inner.clipGroupBlockId).toBe('0');
    state = editorSlideReducer(state, { type: 'SELECCIONAR', id: '1' });
    expect(state.inner.clipGroupBlockId).toBeNull();
  });
});

describe('mover / clamp / undo manual', () => {
  it('MOVER pos usa getBlockPos → withClampedPosition (contrato 3.2)', () => {
    const block = texto(1, { x: 10, y: 10, ancho: 20, alto: 10 });
    const expected = withClampedPosition(block, 40, 30);
    const state = reduce(
      createInitialEditorSlideState(slideCon([block])),
      { type: 'MOVER', via: 'pos', blockPath: '0', x: 40, y: 30 },
    );
    expect(state.bloquesOptimistic).toBe(true);
    expect(getBlockPos(state.bloques[0]!)).toEqual(getBlockPos(expected));
    expect(editorBloquesOverride(state)).toBe(state.bloques);
  });

  it('MOVER no mueve un bloque canvasLocked', () => {
    const block = texto(1, { canvasLocked: true, x: 10, y: 10 });
    const state = reduce(
      createInitialEditorSlideState(slideCon([block])),
      { type: 'MOVER', via: 'pos', blockPath: '0', x: 80, y: 80 },
    );
    expect(getBlockPos(state.bloques[0]!)).toEqual(getBlockPos(block));
    expect(state.bloquesOptimistic).toBe(false);
  });

  it('MOVER pos escribe marco en actividades, no x/y sueltos', () => {
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
    } satisfies ActivityBlock;
    const state = reduce(
      createInitialEditorSlideState(slideCon([activity])),
      { type: 'MOVER', via: 'pos', blockPath: '0', x: 20, y: 15 },
    );
    const moved = state.bloques[0] as ActivityBlock;
    expect(moved.tipo).toBe('actividad');
    expect(moved.marco?.izquierdaPct).toBe(20);
    expect(moved.marco?.arribaPct).toBe(15);
    expect(moved).not.toHaveProperty('x');
  });

  it('MOVER nudge coincide con applyNudgeToBlocks inline de canvas-area', () => {
    const bloques = [texto(1), texto(2)];
    const expected = applyNudgeToBlocks(bloques, [0, 1], 10, -5);
    const state = reduce(
      createInitialEditorSlideState(slideCon(bloques)),
      { type: 'MOVER', via: 'nudge', indices: [0, 1], dxPx: 10, dyPx: -5 },
    );
    expect(state.bloques.map((b) => getBlockPos(b))).toEqual(
      expected.map((b) => getBlockPos(b)),
    );
  });

  it('mover + APLICAR_SNAPSHOT restaura los bloques (undo manual)', () => {
    const original = [texto(1, { x: 12, y: 14 })];
    const start = createInitialEditorSlideState(slideCon(original));
    const moved = editorSlideReducer(start, {
      type: 'MOVER',
      via: 'pos',
      blockPath: '0',
      x: 50,
      y: 40,
    });
    expect(getBlockPos(moved.bloques[0]!).x).not.toBe(12);

    const undone = editorSlideReducer(moved, {
      type: 'APLICAR_SNAPSHOT',
      bloques: start.bloques,
      fondo: start.fondo,
      guias: start.guias,
    });
    expect(getBlockPos(undone.bloques[0]!)).toEqual(getBlockPos(original[0]!));
  });
});

describe('redimensionar / rotar', () => {
  it('REDIMENSIONAR handle coincide con computeNewCoords + withRect', () => {
    const block = texto(1, { x: 10, y: 20, ancho: 30, alto: 20 });
    const pos = getBlockPos(block);
    const coords = computeNewCoords(
      'SE',
      pos.x,
      pos.y,
      pos.ancho,
      pos.alto,
      5,
      4,
      false,
      getBlockResizeMinDim(block.tipo),
    );
    const expected = withRect(block, coords.x, coords.y, coords.ancho, coords.alto);
    const state = reduce(
      createInitialEditorSlideState(slideCon([block])),
      {
        type: 'REDIMENSIONAR',
        via: 'handle',
        blockPath: '0',
        dir: 'SE',
        dxPct: 5,
        dyPct: 4,
      },
    );
    expect(getBlockPos(state.bloques[0]!)).toEqual(getBlockPos(expected));
  });

  it('ROTAR usa withRotation + normalizeAngle', () => {
    const block = texto(1);
    const state = reduce(
      createInitialEditorSlideState(slideCon([block])),
      { type: 'ROTAR', blockPath: '0', angle: 370 },
    );
    expect((state.bloques[0] as { rotacion?: number }).rotacion).toBe(
      withRotation(block, normalizeAngle(370)).rotacion,
    );
  });
});

describe('pegar / añadir / eliminar', () => {
  it('PEGAR y AÑADIR_BLOQUE anexan al final', () => {
    const extra = texto(9, { contenido: 'nuevo' });
    const pasted = reduce(
      createInitialEditorSlideState(slideCon([texto(0)])),
      { type: 'PEGAR', block: extra },
    );
    expect(pasted.bloques).toHaveLength(2);
    expect(pasted.bloques[1]).toEqual(extra);
    expect(pasted.bloquesOptimistic).toBe(true);

    const added = reduce(
      createInitialEditorSlideState(slideCon([texto(0)])),
      { type: 'AÑADIR_BLOQUE', block: extra },
    );
    expect(added.bloques).toEqual(pasted.bloques);
  });

  it('ELIMINAR_BLOQUE quita el bloque y limpia la selección', () => {
    const state = reduce(
      createInitialEditorSlideState(slideCon([texto(0), texto(1)])),
      { type: 'SELECCIONAR', id: '1' },
      { type: 'ELIMINAR_BLOQUE', blockPath: '1' },
    );
    expect(state.bloques).toHaveLength(1);
    expect((state.bloques[0] as { contenido: string }).contenido).toBe('t0');
    expect(state.selectedBlockId).toBeNull();
    expect(state.selectedBlockIds).toEqual([]);
  });
});

describe('fondo / guías / reset / overlay', () => {
  it('FONDO y GUIAS actualizan meta sin tocar bloques', () => {
    const start = createInitialEditorSlideState(slideCon([texto(0)]));
    const next = reduce(
      start,
      { type: 'FONDO', fondo: { tipo: 'color', valor: '#112233' } },
      {
        type: 'GUIAS',
        guias: { ...EMPTY_SLIDE_GUIAS, verticales: [640], horizontales: [360] },
      },
    );
    expect(next.fondo).toEqual({ tipo: 'color', valor: '#112233' });
    expect(next.guias.verticales).toEqual([640]);
    expect(next.bloques).toEqual(start.bloques);
    expect(next.bloquesOptimistic).toBe(false);
  });

  it('RESETEAR_DESDE_SLIDE restaura el slide y conserva layersPanelOpen', () => {
    const a = slideCon([texto(0)], 'a');
    const b = slideCon([texto(3)], 'b');
    const dirty = reduce(
      createInitialEditorSlideState(a),
      { type: 'SELECCIONAR', id: '0' },
      { type: 'MOVER', via: 'pos', blockPath: '0', x: 70, y: 70 },
      { type: 'LAYERS_PANEL', open: true },
    );
    const reset = editorSlideReducer(dirty, {
      type: 'RESETEAR_DESDE_SLIDE',
      slide: b,
    });
    expect(reset.slideId).toBe('b');
    expect(reset.bloques).toEqual(b.bloques);
    expect(reset.bloquesOptimistic).toBe(false);
    expect(reset.selectedBlockId).toBeNull();
    expect(reset.layersPanelOpen).toBe(true);
  });

  it('CLEAR_BLOQUES_OVERRIDE apaga el overlay (paridad setCommittedBloques(null))', () => {
    const moved = reduce(
      createInitialEditorSlideState(slideCon([texto(0)])),
      { type: 'MOVER', via: 'replace', bloques: [texto(0, { x: 40, y: 40 })] },
    );
    expect(editorBloquesOverride(moved)).not.toBeNull();
    const cleared = editorSlideReducer(moved, { type: 'CLEAR_BLOQUES_OVERRIDE' });
    expect(editorBloquesOverride(cleared)).toBeNull();
    expect(cleared.bloques[0]).toEqual(moved.bloques[0]);
  });
});
