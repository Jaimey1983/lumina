import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AppWindow,
  Columns2,
  FileText,
  GalleryHorizontal,
  GitCommitHorizontal,
  Hand,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Minus,
  MousePointer2,
  PanelTop,
  ScanFace,
  Shapes,
  Target,
  RotateCw,
  CircleDot,
  BarChart2,
  Timer,
  Video,
} from 'lucide-react';

import { getWidgetPanelItem } from '@/app/(app)/classes/[id]/editor/components/panels/widget-panel-catalog';
import { isUnimplementedInteractiveStub } from '@/lib/class-slide-normalize';
import { isBlockCanvasLocked } from '@/hooks/use-block-drag';
import { getEffectiveBlockZ } from '@lumina/editor-shared/block-pos';
import type { Block, BlockTipo } from '@lumina/types/slide';

export type LayerReorderAction =
  | 'traer_frente'
  | 'enviar_atras_total'
  | 'adelante_uno'
  | 'atras_uno';

export interface LayerListItem {
  index: number;
  blockId: string;
  zIndex: number;
  label: string;
  kind: string;
  locked: boolean;
  Icon: LucideIcon;
}

/** z efectivo (el mismo que usa el render: sin `zIndex` ⇒ `DEFAULT_BLOCK_Z`). */
export function getBlockZ(block: Block): number {
  return getEffectiveBlockZ(block);
}

const ACTIVITY_LABELS: Record<string, string> = {
  quiz_multiple: 'Quiz opción múltiple',
  verdadero_falso: 'Verdadero / Falso',
  llenar_espacios: 'Llenar espacios',
  respuesta_corta: 'Respuesta corta',
  arrastrar_soltar: 'Drag & Drop',
  emparejar: 'Emparejar',
  ordenar: 'Ordenar pasos',
  video_interactivo: 'Video interactivo',
  clasificar: 'Clasificar',
  memoria: 'Memoria',
  puzzle_imagen: 'Puzzle de imagen',
  sopa_letras: 'Sopa de letras',
  crucigrama: 'Crucigrama',
  abrir_caja: 'Abrir caja',
  anagrama: 'Anagrama',
  ahorcado: 'Ahorcado',
  puzzle_palabras: 'Puzzle de palabras',
  globos: 'Globos',
  topo: 'Golpea al topo',
  ruleta: 'Ruleta',
  encuesta_vivo: 'Encuesta en vivo',
  nube_palabras: 'Nube de palabras',
  torneo: 'Torneo de preguntas',
  escape_room: 'Escape Room',
  historia_ramificada: 'Historia ramificada',
};

const BASIC_KIND: Partial<Record<BlockTipo, string>> = {
  texto: 'Texto',
  imagen: 'Imagen',
  video: 'Video',
  audio: 'Audio',
  'clip-group': 'Máscara',
  codigo: 'Código',
  cita: 'Cita',
  separador: 'Separador',
  columnas: 'Columnas',
  actividad: 'Actividad',
};

const BASIC_ICON: Partial<Record<BlockTipo, LucideIcon>> = {
  texto: FileText,
  imagen: ImageIcon,
  video: Video,
  audio: Activity,
  'clip-group': ScanFace,
  codigo: FileText,
  cita: MessageSquare,
  separador: Minus,
  columnas: Columns2,
  actividad: Activity,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max = 36): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function getBlockLayerKind(block: Block): string {
  if (block.tipo === 'actividad') {
    const t = block.actividad?.tipo;
    return (t && ACTIVITY_LABELS[t]) || 'Actividad';
  }
  if (block.tipo === 'diagrama') {
    return block.subtipo === 'venn' ? 'Diagrama de Venn' : 'Diagrama';
  }
  if (block.tipo === 'grafico') return 'Gráfico';
  if (BASIC_KIND[block.tipo]) return BASIC_KIND[block.tipo]!;
  const widget = getWidgetPanelItem(block.tipo as Parameters<typeof getWidgetPanelItem>[0]);
  if (widget) return widget.label;
  return block.tipo;
}

export function getBlockLayerIcon(block: Block): LucideIcon {
  if (BASIC_ICON[block.tipo]) return BASIC_ICON[block.tipo]!;
  const widget = getWidgetPanelItem(block.tipo as Parameters<typeof getWidgetPanelItem>[0]);
  if (widget) return widget.Icon;
  switch (block.tipo) {
    case 'flip-cards':
      return Layers;
    case 'tabs':
      return PanelTop;
    case 'carousel':
      return GalleryHorizontal;
    case 'click-reveal':
      return Hand;
    case 'timeline':
      return GitCommitHorizontal;
    case 'popup':
      return AppWindow;
    case 'hotspot':
      return Target;
    case 'tooltip':
      return MessageSquare;
    case 'boton':
      return MousePointer2;
    case 'contador':
      return Timer;
    case 'progreso':
      return Columns2;
    case 'ruleta':
      return RotateCw;
    case 'grafico':
      return BarChart2;
    case 'diagrama':
      return CircleDot;
    default:
      return Shapes;
  }
}

export function getBlockLayerLabel(block: Block): string {
  switch (block.tipo) {
    case 'texto': {
      const plain = stripHtml(block.contenido ?? '');
      return truncate(plain || 'Texto');
    }
    case 'imagen':
      return truncate(block.alt || block.caption || 'Imagen');
    case 'video':
      return truncate(block.url || 'Video');
    case 'separador':
      return 'Línea';
    case 'clip-group':
      return truncate(
        block.contenido.tipo === 'imagen'
          ? block.contenido.alt || block.contenido.url || 'Máscara'
          : block.contenido.tipo === 'color'
            ? block.contenido.valor
            : 'Máscara',
      );
    case 'actividad': {
      const act = block.actividad as {
        pregunta?: string;
        preguntas?: { texto?: string }[];
      };
      const q = act.preguntas?.[0]?.texto ?? act.pregunta ?? '';
      return truncate(q || getBlockLayerKind(block));
    }
    case 'flip-cards':
      return truncate(block.tituloWidget || 'Flip Cards');
    case 'tabs':
      return truncate(block.tituloWidget || 'Pestañas');
    case 'carousel':
      return truncate(block.tituloWidget || 'Carrusel');
    case 'click-reveal':
      return truncate(block.tituloWidget || 'Click to Reveal');
    case 'timeline':
      return truncate(block.tituloWidget || 'Línea de tiempo');
    case 'popup':
      return truncate(block.tituloWidget || 'Popup');
    case 'hotspot':
      return truncate(block.instruccion || block.tituloWidget || 'Hotspot');
    case 'tooltip':
      return truncate(block.textoTrigger || block.textoTooltip || 'Tooltip');
    case 'boton':
      return truncate(block.texto || 'Botón');
    case 'contador':
      return truncate(block.etiqueta || 'Contador');
    case 'progreso':
      return truncate(block.etiqueta || 'Barra de progreso');
    case 'ruleta':
      return 'Ruleta';
    case 'grafico':
      return truncate(block.titulo || 'Gráfico');
    case 'diagrama':
      return truncate(
        block.titulo ||
          (block.subtipo === 'venn' ? 'Diagrama de Venn' : 'Diagrama'),
      );
    default:
      return getBlockLayerKind(block);
  }
}

/** Lista de capas: frente arriba (zIndex mayor primero). */
export function buildLayerList(bloques: Block[]): LayerListItem[] {
  const items: LayerListItem[] = [];
  bloques.forEach((block, index) => {
    if (isUnimplementedInteractiveStub(block)) return;
    items.push({
      index,
      blockId: String(index),
      zIndex: getBlockZ(block),
      label: getBlockLayerLabel(block),
      kind: getBlockLayerKind(block),
      locked: isBlockCanvasLocked(block),
      Icon: getBlockLayerIcon(block),
    });
  });
  return items.sort((a, b) => b.zIndex - a.zIndex || b.index - a.index);
}

/** Orden de apilado de los bloques de primer nivel: de atrás hacia adelante. */
function stackingOrder(bloques: Block[]): number[] {
  return bloques
    .map((b, i) => ({ i, z: getBlockZ(b) }))
    .sort((a, b) => a.z - b.z || a.i - b.i)
    .map((e) => e.i);
}

/**
 * Reordena un bloque dentro de la pila (`traer_frente`, `enviar_atras_total`,
 * `adelante_uno`, `atras_uno`) y renumera el `zIndex` de los bloques de primer
 * nivel como 1..N. Así cada acción mueve exactamente una posición (o va al
 * extremo), sin empates, huecos ni deriva. Solo se reescriben los bloques cuyo
 * z cambia; si la acción no tiene efecto devuelve el mismo array.
 */
export function applyLayerReorderAction(
  bloques: Block[],
  targetIndex: number,
  action: LayerReorderAction,
): Block[] {
  if (targetIndex < 0 || targetIndex >= bloques.length) return bloques;

  const order = stackingOrder(bloques);
  const pos = order.indexOf(targetIndex);
  const last = order.length - 1;

  let to = pos;
  switch (action) {
    case 'traer_frente':
      to = last;
      break;
    case 'enviar_atras_total':
      to = 0;
      break;
    case 'adelante_uno':
      to = Math.min(pos + 1, last);
      break;
    case 'atras_uno':
      to = Math.max(pos - 1, 0);
      break;
    default:
      return bloques;
  }
  if (to === pos) return bloques;

  order.splice(pos, 1);
  order.splice(to, 0, targetIndex);

  const nextZ = new Map<number, number>();
  order.forEach((blockIndex, rank) => nextZ.set(blockIndex, rank + 1));

  return bloques.map((b, i) => {
    const z = nextZ.get(i)!;
    return (b as { zIndex?: number }).zIndex === z
      ? b
      : ({ ...b, zIndex: z } as Block);
  });
}
