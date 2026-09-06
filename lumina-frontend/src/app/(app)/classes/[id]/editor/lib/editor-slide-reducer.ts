import {
  applyNudgeToBlocks,
  clampDragCorner,
  getBlockPos,
  isBlockCanvasLocked,
  withClampedPosition,
  withRect,
  withRotation,
} from '@/hooks/use-block-drag';
import {
  getBlockAtPath,
  removeBlockAtPath,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import type { Block } from '@/types/slide.types';

import { getBlockResizeMinDim } from './block-resize-min-dim';
import { computeNewCoords } from './resize-coords';
import { normalizeAngle } from './rotate-coords';
import {
  createInitialEditorSlideState,
  EMPTY_INNER_SELECTION,
  type EditorSlideAction,
  type EditorSlideState,
} from './editor-slide-state';

function clearSelection(state: EditorSlideState): EditorSlideState {
  return {
    ...state,
    selectedBlockId: null,
    selectedBlockIds: [],
    inner: { ...EMPTY_INNER_SELECTION },
  };
}

function selectPrimary(
  state: EditorSlideState,
  id: string | null,
  ids: string[],
): EditorSlideState {
  const nextId = id && id !== '' ? id : null;
  const inner =
    state.selectedBlockId !== nextId
      ? { ...EMPTY_INNER_SELECTION }
      : state.inner;
  return {
    ...state,
    selectedBlockId: nextId,
    selectedBlockIds: nextId ? ids : [],
    inner: nextId ? { ...inner, clipGroupBlockId: null } : { ...EMPTY_INNER_SELECTION },
  };
}

function withOptimisticBloques(
  state: EditorSlideState,
  bloques: Block[],
): EditorSlideState {
  return { ...state, bloques, bloquesOptimistic: true };
}

function replaceBlockAtPath(
  state: EditorSlideState,
  blockPath: string,
  fn: (block: Block) => Block,
): EditorSlideState {
  const current = getBlockAtPath(state.bloques, blockPath);
  if (!current) return state;
  if (isBlockCanvasLocked(current)) return state;
  const next = updateBlockAtPath(state.bloques, blockPath, fn);
  if (next === state.bloques) return state;
  return withOptimisticBloques(state, next);
}

/**
 * Reducer puro del slide en edición.
 * Contrato 3.2: leer (`getBlockPos`) → transformar → clamp.
 * E5.2 no persiste ni registra historial (eso sigue en `canvas-area`).
 */
export function editorSlideReducer(
  state: EditorSlideState,
  action: EditorSlideAction,
): EditorSlideState {
  switch (action.type) {
    case 'SELECCIONAR': {
      const id = action.id && action.id !== '' ? action.id : null;
      return selectPrimary(state, id, id ? [id] : []);
    }

    case 'SELECCIONAR_MULTIPLE': {
      const ids = action.ids.filter((id) => id !== '');
      const primary = ids.length > 0 ? ids[ids.length - 1]! : null;
      return selectPrimary(state, primary, ids);
    }

    case 'INNER_SELECTION': {
      if (action.inner === 'clear') {
        return { ...state, inner: { ...EMPTY_INNER_SELECTION } };
      }
      return { ...state, inner: { ...state.inner, ...action.inner } };
    }

    case 'MARQUEE':
      return { ...state, marqueeRect: action.rect };

    case 'LAYERS_PANEL':
      return {
        ...state,
        layersPanelOpen:
          action.open !== undefined ? action.open : !state.layersPanelOpen,
      };

    case 'MOVER': {
      if (action.via === 'replace') {
        return withOptimisticBloques(state, action.bloques);
      }
      if (action.via === 'nudge') {
        const next = applyNudgeToBlocks(
          state.bloques,
          action.indices,
          action.dxPx,
          action.dyPx,
        );
        return withOptimisticBloques(state, next);
      }
      return replaceBlockAtPath(state, action.blockPath, (block) =>
        withClampedPosition(block, action.x, action.y),
      );
    }

    case 'REDIMENSIONAR': {
      if (action.via === 'handle') {
        return replaceBlockAtPath(state, action.blockPath, (block) => {
          const pos = getBlockPos(block);
          const minDim = getBlockResizeMinDim(block.tipo);
          const next = computeNewCoords(
            action.dir,
            pos.x,
            pos.y,
            pos.ancho,
            pos.alto,
            action.dxPct,
            action.dyPct,
            action.lockAspectRatio ?? false,
            minDim,
          );
          return withRect(block, next.x, next.y, next.ancho, next.alto);
        });
      }
      return replaceBlockAtPath(state, action.blockPath, (block) => {
        const clamped = clampDragCorner(
          action.x,
          action.y,
          action.ancho,
          action.alto,
        );
        return withRect(block, clamped.x, clamped.y, action.ancho, action.alto);
      });
    }

    case 'ROTAR':
      return replaceBlockAtPath(state, action.blockPath, (block) =>
        withRotation(block, normalizeAngle(action.angle)),
      );

    case 'EDITAR_BLOQUE': {
      const current = getBlockAtPath(state.bloques, action.blockPath);
      if (!current) return state;
      const next = updateBlockAtPath(state.bloques, action.blockPath, () => action.block);
      if (next === state.bloques) return state;
      return withOptimisticBloques(state, next);
    }

    case 'AÑADIR_BLOQUE':
      return withOptimisticBloques(state, [...state.bloques, action.block]);

    case 'ELIMINAR_BLOQUE': {
      const next = removeBlockAtPath(state.bloques, action.blockPath);
      if (next === state.bloques) return state;
      return clearSelection(withOptimisticBloques(state, next));
    }

    case 'PEGAR':
      return withOptimisticBloques(state, [...state.bloques, action.block]);

    case 'FONDO':
      return { ...state, fondo: action.fondo };

    case 'GUIAS':
      return { ...state, guias: action.guias };

    case 'RESETEAR_DESDE_SLIDE': {
      const reset = createInitialEditorSlideState(action.slide);
      return { ...reset, layersPanelOpen: state.layersPanelOpen };
    }

    case 'APLICAR_SNAPSHOT':
      return {
        ...state,
        bloques: action.bloques,
        bloquesOptimistic: true,
        fondo: action.fondo,
        guias: action.guias,
        transicion: action.transicion,
      };

    case 'CLEAR_BLOQUES_OVERRIDE':
      return { ...state, bloquesOptimistic: false };

    default:
      return state;
  }
}
