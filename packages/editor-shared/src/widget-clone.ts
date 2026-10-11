import type { Block } from '@lumina/types/slide';
import type { WidgetSlideContent } from '@lumina/types/widget';
import { resolveFreeformPath } from './freeform-mask.js';

function remintId(): string {
  return crypto.randomUUID();
}

function remintSlideContent(slide: WidgetSlideContent): WidgetSlideContent {
  return {
    ...slide,
    id: remintId(),
    bloques: slide.bloques?.map((b) => ({ ...b, id: remintId() })),
  };
}

function remintNestedBlock(block: Block): Block {
  const withChildren = remintBlockChildIds(block);
  if ('id' in withChildren && typeof withChildren.id === 'string') {
    return { ...withChildren, id: remintId() };
  }
  return withChildren;
}

/** Listas con `id` propio dentro de `configuracion` de los widgets que solo viven en el registry. */
const LISTA_CON_ID_SOLO_REGISTRY = { stepper: 'pasos', galeria: 'imagenes' } as const;

function remintListaDeConfiguracion(block: Block, clave: string): Block {
  const configuracion = (block as { configuracion?: Record<string, unknown> }).configuracion;
  const lista = configuracion?.[clave];
  if (!configuracion || !Array.isArray(lista)) return block;
  return {
    ...block,
    configuracion: {
      ...configuracion,
      [clave]: lista.map((item) => ({ ...(item as object), id: remintId() })),
    },
  } as Block;
}

/**
 * Regenera IDs de hijos al duplicar/pegar. El `id` del bloque raíz lo asigna el caller.
 * Así fichas, tarjetas, overlays y nodos no comparten identidad con el original.
 */
export function remintBlockChildIds(block: Block): Block {
  // Stepper y Galería no están en el union `Block` viejo (Regla 3): sus pasos / imágenes llevan `id`.
  const tipoRegistry = (block as { tipo: string }).tipo;
  if (tipoRegistry === 'stepper' || tipoRegistry === 'galeria') {
    return remintListaDeConfiguracion(block, LISTA_CON_ID_SOLO_REGISTRY[tipoRegistry]);
  }
  switch (block.tipo) {
    case 'tabs':
      return { ...block, fichas: (block.fichas ?? []).map(remintSlideContent) };
    case 'carousel':
      return { ...block, slides: (block.slides ?? []).map(remintSlideContent) };
    case 'flip-cards':
      return {
        ...block,
        tarjetas: (block.tarjetas ?? []).map((t) => ({ ...t, id: remintId() })),
      };
    case 'click-reveal':
      return {
        ...block,
        triggers: (block.triggers ?? []).map((t) => ({ ...t, id: remintId() })),
        overlays: (block.overlays ?? []).map(remintSlideContent),
      };
    case 'timeline':
      return {
        ...block,
        nodos: (block.nodos ?? []).map((n) => ({ ...n, id: remintId() })),
      };
    case 'popup':
    case 'hotspot':
      return block.overlay
        ? { ...block, overlay: remintSlideContent(block.overlay) }
        : block;
    case 'columnas':
      return {
        ...block,
        columnas: (block.columnas ?? []).map((col) => col.map(remintNestedBlock)),
      };
    case 'clip-group':
      if (block.clipShape.tipo === 'libre') {
        const src = resolveFreeformPath(block.clipShape);
        return {
          ...block,
          clipShape: {
            tipo: 'libre',
            path: {
              closed: src.closed,
              nodes: src.nodes.map((n) => ({ ...n, id: remintId() })),
            },
          },
        };
      }
      return block;
    default:
      return block;
  }
}
