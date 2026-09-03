import { parseBlockDragIndex } from './block-drag-id';
import type { Block, Slide } from '@/types/slide.types';

const BLOCK_TIPO_LABEL: Record<string, string> = {
  texto: 'Texto',
  imagen: 'Imagen',
  video: 'Video',
  audio: 'Audio',
  actividad: 'Actividad',
  separador: 'Línea',
  'clip-group': 'Recorte',
  'flip-cards': 'Flip Cards',
  tabs: 'Tabs',
  carousel: 'Carousel',
  'click-reveal': 'Click to Reveal',
  timeline: 'Línea de tiempo',
  popup: 'Popup',
  hotspot: 'Hotspot',
  tooltip: 'Tooltip',
  boton: 'Botón',
  contador: 'Contador',
  progreso: 'Progreso',
  ruleta: 'Ruleta',
  grafico: 'Gráfico',
  diagrama: 'Diagrama',
};

export function canvasBlockOverlayLabel(block: Block | undefined): string | null {
  if (!block) return null;
  return BLOCK_TIPO_LABEL[block.tipo] ?? block.tipo;
}

/** Overlay de rail (actividad/widget) vs chip de bloque en lienzo. Nunca clona el bloque. */
export function resolveCanvasBlockOverlayLabel(
  slide: Slide | null,
  draggingId: string | null,
): string | null {
  if (!draggingId || !slide) return null;
  const index = parseBlockDragIndex(draggingId);
  if (index === null) return null;
  return canvasBlockOverlayLabel(slide.bloques?.[index]);
}
