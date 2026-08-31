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
  MousePointer2,
  PanelTop,
  ScanFace,
  Shapes,
  Square,
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
import type { Block, BlockTipo } from '@/types/slide.types';

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

export function getBlockZ(block: Block): number {
  const z = (block as { zIndex?: number }).zIndex;
  return typeof z === 'number' ? z : 0;
}

export function collectZIndices(blocks: Block[]): number[] {
  const out: number[] = [];
  function walk(arr: Block[]) {
    for (const b of arr) {
      out.push(getBlockZ(b));
      if (b.tipo === 'columnas') {
        for (const col of b.columnas) walk(col);
      }
    }
  }
  walk(blocks);
  return out;
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
  forma: 'Forma',
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
  forma: Square,
  'clip-group': ScanFace,
  codigo: FileText,
  cita: MessageSquare,
  separador: Columns2,
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
    case 'forma':
      return truncate(block.forma || 'Forma');
    case 'clip-group':
      return truncate(
        block.contenido.tipo === 'imagen'
          ? block.contenido.alt || block.contenido.url || 'Máscara'
          : block.contenido.tipo === 'color'
            ? block.contenido.valor
            : 'Máscara',
      );
    case 'actividad': {
      const q =
        'pregunta' in block.actividad
          ? String((block.actividad as { pregunta?: string }).pregunta ?? '')
          : '';
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

export function applyLayerReorderAction(
  bloques: Block[],
  targetIndex: number,
  action: LayerReorderAction,
): Block[] {
  if (targetIndex < 0 || targetIndex >= bloques.length) return bloques;
  const zs = collectZIndices(bloques);
  if (zs.length === 0) return bloques;
  const min = Math.min(...zs);
  const max = Math.max(...zs);
  const block = bloques[targetIndex];
  if (!block) return bloques;
  const z = getBlockZ(block);
  let nz = z;
  switch (action) {
    case 'traer_frente':
      nz = max + 1;
      break;
    case 'enviar_atras_total':
      nz = min - 1;
      break;
    case 'adelante_uno':
      nz = z + 1;
      break;
    case 'atras_uno':
      nz = z - 1;
      break;
    default:
      return bloques;
  }
  return bloques.map((b, i) =>
    i === targetIndex ? ({ ...b, zIndex: nz } as Block) : b,
  );
}
