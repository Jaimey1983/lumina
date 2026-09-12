import type { FlipCardsInnerSelection } from '@lumina/element-kit/widgets/flip-cards/flip-cards-config';
import type { TabsInnerSelection } from '@lumina/element-kit/widgets/tabs/tabs-config';
import type { CarouselInnerSelection } from '@lumina/element-kit/widgets/carousel/carousel-config';
import type { ClickRevealInnerSelection } from '@lumina/types/widget';
import type { HotspotInnerSelection } from '@lumina/types/widget';
import type { PopupInnerSelection } from '@lumina/types/widget';
import type { TimelineInnerSelection } from '@lumina/element-kit/widgets/timeline/timeline-config';
import type { Background, Block, Slide, SlideGuias } from '@lumina/types/slide';
import { EMPTY_SLIDE_GUIAS } from '@lumina/types/slide';

import type { ResizeHandleDir } from './resize-coords';

/** Inner-selection por familia de widget; todas nulas = sin foco interno. */
export interface EditorInnerSelection {
  flipCards: FlipCardsInnerSelection | null;
  tabs: TabsInnerSelection | null;
  carousel: CarouselInnerSelection | null;
  clickReveal: ClickRevealInnerSelection | null;
  popup: PopupInnerSelection | null;
  hotspot: HotspotInnerSelection | null;
  timeline: TimelineInnerSelection | null;
  clipGroupBlockId: string | null;
}

export const EMPTY_INNER_SELECTION: EditorInnerSelection = {
  flipCards: null,
  tabs: null,
  carousel: null,
  clickReveal: null,
  popup: null,
  hotspot: null,
  timeline: null,
  clipGroupBlockId: null,
};

/**
 * Estado central de un solo slide en edición (decisión E5 raíz §2).
 * El mazo (`cls.slides`) sigue en react-query.
 *
 * `bloquesOptimistic`: overlay local (post-drag / persist en vuelo).
 * Si es `false`, el canvas lee `slide.bloques` del servidor — misma semántica
 * que el antiguo `committedBloques: Block[] | null`.
 */
export interface EditorSlideState {
  slideId: string | null;
  bloques: Block[];
  bloquesOptimistic: boolean;
  fondo?: Background;
  guias: SlideGuias;
  transicion?: Slide['transicion'];
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  inner: EditorInnerSelection;
  layersPanelOpen: boolean;
}

export type EditorSlideAction =
  | { type: 'SELECCIONAR'; id: string | null }
  | { type: 'SELECCIONAR_MULTIPLE'; ids: string[] }
  | { type: 'INNER_SELECTION'; inner: Partial<EditorInnerSelection> | 'clear' }
  | { type: 'LAYERS_PANEL'; open?: boolean }
  | { type: 'MOVER'; via: 'pos'; blockPath: string; x: number; y: number }
  | { type: 'MOVER'; via: 'nudge'; indices: number[]; dxPx: number; dyPx: number }
  | { type: 'MOVER'; via: 'replace'; bloques: Block[] }
  | {
      type: 'REDIMENSIONAR';
      via: 'rect';
      blockPath: string;
      x: number;
      y: number;
      ancho: number;
      alto: number;
    }
  | {
      type: 'REDIMENSIONAR';
      via: 'handle';
      blockPath: string;
      dir: ResizeHandleDir;
      dxPct: number;
      dyPct: number;
      lockAspectRatio?: boolean;
    }
  | { type: 'ROTAR'; blockPath: string; angle: number }
  | { type: 'EDITAR_BLOQUE'; blockPath: string; block: Block }
  | { type: 'AÑADIR_BLOQUE'; block: Block }
  | { type: 'ELIMINAR_BLOQUE'; blockPath: string }
  | { type: 'PEGAR'; block: Block }
  | { type: 'FONDO'; fondo: Background }
  | { type: 'GUIAS'; guias: SlideGuias }
  | { type: 'RESETEAR_DESDE_SLIDE'; slide: Slide | null }
  | {
      type: 'APLICAR_SNAPSHOT';
      bloques: Block[];
      fondo?: Background;
      guias: SlideGuias;
      transicion?: Slide['transicion'];
    }
  /** Quita el overlay optimista (equivalente a `setCommittedBloques(null)`). */
  | { type: 'CLEAR_BLOQUES_OVERRIDE' };

export function createInitialEditorSlideState(
  slide: Slide | null,
): EditorSlideState {
  return {
    slideId: slide?.id ?? null,
    bloques: slide?.bloques ? [...slide.bloques] : [],
    bloquesOptimistic: false,
    fondo: slide?.fondo,
    guias: slide?.guias ?? EMPTY_SLIDE_GUIAS,
    transicion: slide?.transicion,
    selectedBlockId: null,
    selectedBlockIds: [],
    inner: { ...EMPTY_INNER_SELECTION },
    layersPanelOpen: false,
  };
}

/** Overlay que el canvas usa en lugar de `slide.bloques` (o `null` = servidor). */
export function editorBloquesOverride(state: EditorSlideState): Block[] | null {
  return state.bloquesOptimistic ? state.bloques : null;
}
