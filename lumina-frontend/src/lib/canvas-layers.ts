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
  Sigma,
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
  respuesta_matematica: 'Respuesta matemática',
  balancear_ecuacion: 'Balancear ecuación',
  ubicar_elemento: 'Ubicar en la tabla',
  formular_compuesto: 'Formular compuesto',
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
  ecuacion: 'Ecuación',
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
  ecuacion: Sigma,
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
    case 'ecuacion':
      return truncate(block.latex || 'Ecuación');
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
 * Reordena uno o varios bloques dentro de la pila (`traer_frente`,
 * `enviar_atras_total`, `adelante_uno`, `atras_uno`) y renumera el `zIndex` de
 * los bloques de primer nivel como 1..N. Cada acción mueve exactamente una
 * posición (o va al extremo), sin empates, huecos ni deriva.
 *
 * Con varios bloques se conserva su orden relativo. Un paso "adelante/atrás"
 * salta al vecino más cercano que NO está seleccionado (como en Figma), y los
 * bloques ya en el borde de la pila no se mueven.
 *
 * Solo se reescriben los bloques cuyo z cambia; si la acción no tiene efecto
 * devuelve el mismo array. Los bloques fijados (`canvasLocked`) sí se pueden
 * reordenar: el fijado protege posición y tamaño, no la capa.
 */
export function applyLayerReorderAction(
  bloques: Block[],
  target: number | number[],
  action: LayerReorderAction,
): Block[] {
  const targets = new Set(
    (Array.isArray(target) ? target : [target]).filter(
      (i) => Number.isInteger(i) && i >= 0 && i < bloques.length,
    ),
  );
  if (targets.size === 0) return bloques;

  const order = stackingOrder(bloques);
  const next = [...order];
  const last = next.length - 1;

  switch (action) {
    case 'traer_frente':
      next.splice(0, next.length, ...order.filter((i) => !targets.has(i)), ...order.filter((i) => targets.has(i)));
      break;
    case 'enviar_atras_total':
      next.splice(0, next.length, ...order.filter((i) => targets.has(i)), ...order.filter((i) => !targets.has(i)));
      break;
    case 'adelante_uno':
      for (let p = last - 1; p >= 0; p--) {
        if (targets.has(next[p]!) && !targets.has(next[p + 1]!)) {
          [next[p], next[p + 1]] = [next[p + 1]!, next[p]!];
        }
      }
      break;
    case 'atras_uno':
      for (let p = 1; p <= last; p++) {
        if (targets.has(next[p]!) && !targets.has(next[p - 1]!)) {
          [next[p], next[p - 1]] = [next[p - 1]!, next[p]!];
        }
      }
      break;
    default:
      return bloques;
  }
  if (next.every((v, p) => v === order[p])) return bloques;

  const nextZ = new Map<number, number>();
  next.forEach((blockIndex, rank) => nextZ.set(blockIndex, rank + 1));

  return bloques.map((b, i) => {
    const z = nextZ.get(i)!;
    return (b as { zIndex?: number }).zIndex === z
      ? b
      : ({ ...b, zIndex: z } as Block);
  });
}
