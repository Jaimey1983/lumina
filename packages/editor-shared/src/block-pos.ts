import type { Block } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

// getBlockPos / activityMarcoOrFallback: helpers puros Block->pos extraidos de
// lumina-frontend/src/hooks/use-block-drag.ts (E7.6.5b). Contrato canonico del
// editor de canvas ('leer -> transformar -> clamp'); use-block-drag.ts los re-exporta.

const ACTIVITY_FALLBACK = { x: 5, y: 5, ancho: 90, alto: 90 } as const;
const DEFAULT_FALLBACK  = { x: 5, y: 5, ancho: 90, alto: 90 } as const;

export interface BlockPos {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Returns the canvas-percentage bounding box of a block,
 * applying BLOCK_FALLBACKS for blocks that pre-date the free-canvas system.
 */
export function getBlockPos(block: Block): BlockPos {
  switch (block.tipo) {
    case 'texto': {
      const fb = BLOCK_FALLBACKS.text;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'imagen': {
      const fb = BLOCK_FALLBACKS.image;
      return {
        x:     block.x ?? fb.x,
        y:     block.y ?? fb.y,
        ancho: typeof block.ancho === 'number' ? block.ancho : fb.ancho,
        alto:  typeof block.alto  === 'number' ? block.alto  : fb.alto,
      };
    }
    case 'video': {
      const fb = BLOCK_FALLBACKS.video;
      return {
        x:     block.x ?? fb.x,
        y:     block.y ?? fb.y,
        ancho: typeof block.ancho === 'number' ? block.ancho : fb.ancho,
        alto:  typeof block.alto  === 'number' ? block.alto  : fb.alto,
      };
    }
    case 'separador': {
      const fb = BLOCK_FALLBACKS.separador;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'clip-group': {
      const fb = BLOCK_FALLBACKS.clipGroup;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'flip-cards': {
      const fb = BLOCK_FALLBACKS.flipCards;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'tabs': {
      const fb = BLOCK_FALLBACKS.tabs;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'carousel': {
      const fb = BLOCK_FALLBACKS.carousel;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'click-reveal': {
      const fb = BLOCK_FALLBACKS.clickReveal;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'popup': {
      const fb = BLOCK_FALLBACKS.popup;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'hotspot': {
      const fb = BLOCK_FALLBACKS.hotspot;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'tooltip': {
      const fb = BLOCK_FALLBACKS.tooltip;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'boton': {
      const fb = BLOCK_FALLBACKS.boton;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'contador': {
      const fb = BLOCK_FALLBACKS.contador;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'progreso': {
      const fb = BLOCK_FALLBACKS.progreso;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'ruleta': {
      const fb = BLOCK_FALLBACKS.ruleta;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'timeline': {
      const fb = BLOCK_FALLBACKS.timeline;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'grafico': {
      const fb = BLOCK_FALLBACKS.grafico;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'diagrama': {
      const fb = BLOCK_FALLBACKS.diagrama;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'actividad': {
      const marco = block.marco;
      if (marco) {
        return {
          x: marco.izquierdaPct,
          y: marco.arribaPct,
          ancho: marco.anchoPct,
          alto: marco.altoPct,
        };
      }
      return { ...ACTIVITY_FALLBACK };
    }
    default:
      return { ...DEFAULT_FALLBACK };
  }
}

export function activityMarcoOrFallback(block: Extract<Block, { tipo: 'actividad' }>) {
  return (
    block.marco ?? {
      izquierdaPct: ACTIVITY_FALLBACK.x,
      arribaPct: ACTIVITY_FALLBACK.y,
      anchoPct: ACTIVITY_FALLBACK.ancho,
      altoPct: ACTIVITY_FALLBACK.alto,
    }
  );
}
