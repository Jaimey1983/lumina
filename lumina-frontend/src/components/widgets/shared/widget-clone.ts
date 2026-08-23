import type { Block } from '@/types/slide.types';
import type { WidgetSlideContent } from '@/types/widget.types';

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

/**
 * Regenera IDs de hijos al duplicar/pegar. El `id` del bloque raíz lo asigna el caller.
 * Así fichas, tarjetas, overlays y nodos no comparten identidad con el original.
 */
export function remintBlockChildIds(block: Block): Block {
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
    default:
      return block;
  }
}
