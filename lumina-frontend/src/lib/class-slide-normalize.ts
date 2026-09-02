import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type {
  Activity,
  ActivityBlock,
  Background,
  Block,
  Layout,
  QuizMultiple,
  QuizPregunta,
  Slide,
  SlideGuias,
} from '@/types/slide.types';
import type { TransicionSlide } from '@/types/animation.types';
import { parseSlideGuias } from '@/lib/canvas-guides';
import { normalizarEmparejar } from '@/components/activities/emparejar/emparejar-config';
import { normalizarAbrirCaja } from '@/components/activities/abrir-caja/abrir-caja-config';
import { normalizarGlobos } from '@/components/activities/globos/globos-config';
import { normalizarTopo } from '@/components/activities/topo/topo-config';
import { normalizarAhorcado } from '@/components/activities/ahorcado/ahorcado-config';
import { normalizePopupWidget } from '@/lib/popup-defaults';
import { normalizeHotspotWidget } from '@/lib/hotspot-defaults';
import { normalizeTooltipWidget } from '@/components/widgets/tooltip/tooltip-defaults';
import { normalizeBotonWidget } from '@/components/widgets/boton/boton-defaults';
import { normalizeContadorWidget } from '@/components/widgets/contador/contador-defaults';
import { normalizeProgresoWidget } from '@/components/widgets/progreso/progreso-defaults';
import { normalizeRuletaBlock } from '@/components/widgets/ruleta/ruleta-defaults';
import { normalizeFlipCardsWidget } from '@/components/widgets/flip-cards/flip-cards-config';
import { normalizeTabsWidget } from '@/components/widgets/tabs/tabs-config';
import { normalizeCarouselWidget } from '@/components/widgets/carousel/carousel-config';
import { normalizeClickRevealWidget } from '@/components/widgets/click-reveal/click-reveal-config';
import { normalizeTimelineWidget } from '@/components/widgets/timeline/timeline-config';
import { normalizeClipGroupBlock } from '@/lib/clip-path';
import { normalizeGraficoBlock } from '@/components/graficos/grafico-defaults';
import { normalizeDiagramaBlock } from '@/components/diagramas/diagrama-defaults';

const DEFAULT_FONDO: Background = { tipo: 'color', valor: '#ffffff' };

/** Mapeo de claves de layout (JSON de clase) → `Layout` del renderer. */
export const LAYOUT_FROM_KEY: Record<string, Layout> = {
  en_blanco: { columnas: 1, brecha: 12, relleno: 24 },
  titulo_centrado: {
    columnas: 1,
    alineacionHorizontal: 'centro',
    alineacionVertical: 'centro',
    brecha: 16,
    relleno: 24,
  },
  titulo_centrado_subtitulo: {
    columnas: 1,
    alineacionHorizontal: 'centro',
    alineacionVertical: 'centro',
    brecha: 12,
    relleno: 24,
  },
  titulo_y_contenido: { columnas: 1, brecha: 16, relleno: 24 },
  titulo_texto_imagen: { columnas: 1, brecha: 16, relleno: 24 },
  dos_columnas: { columnas: 2, brecha: 20, relleno: 20 },
  imagen_derecha: { columnas: 2, brecha: 20, relleno: 20 },
  imagen_izquierda: { columnas: 2, brecha: 20, relleno: 20 },
  tres_columnas: { columnas: 3, brecha: 16, relleno: 20 },
  pantalla_completa: { columnas: 1, brecha: 12, relleno: 8 },
};

const FALLBACK_LAYOUT_KEY = 'titulo_y_contenido';

export function getSlideContentRecord(api: ApiSlide | null): Record<string, unknown> {
  if (!api?.content || typeof api.content !== 'object' || Array.isArray(api.content)) {
    return {};
  }
  return { ...(api.content as Record<string, unknown>) };
}

function resolveDiseno(c: Record<string, unknown>): Layout | undefined {
  if (c.diseno && typeof c.diseno === 'object' && !Array.isArray(c.diseno)) {
    return c.diseno as Layout;
  }
  const key =
    typeof c.layout === 'string' && c.layout in LAYOUT_FROM_KEY
      ? c.layout
      : FALLBACK_LAYOUT_KEY;
  return LAYOUT_FROM_KEY[key] ?? LAYOUT_FROM_KEY[FALLBACK_LAYOUT_KEY];
}

const TRANSICION_TIPOS = [
  'none',
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'zoom',
  'flip',
  'cube',
] as const;

function resolveTransicion(c: Record<string, unknown>): TransicionSlide | undefined {
  const raw = c.transicion;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const tipo = o.tipo;
  const duracion = o.duracion;
  if (typeof tipo !== 'string' || typeof duracion !== 'number') return undefined;
  if (!TRANSICION_TIPOS.includes(tipo as (typeof TRANSICION_TIPOS)[number])) {
    return undefined;
  }
  return { tipo: tipo as TransicionSlide['tipo'], duracion };
}

function resolveFondo(c: Record<string, unknown>): Background | undefined {
  const f = c.fondo;
  if (f && typeof f === 'object' && !Array.isArray(f) && 'tipo' in f) {
    return f as Background;
  }
  return DEFAULT_FONDO;
}

const LEGACY_QUIZ_PREGUNTA_ID = 'q-legacy-0';

function asQuizRecord(act: unknown): Record<string, unknown> {
  if (!act || typeof act !== 'object' || Array.isArray(act)) return {};
  return act as Record<string, unknown>;
}

/** Migra `quiz_multiple` de pregunta única (legacy) a contenedor `preguntas[]`. Idempotente. */
export function normalizarQuizMultiple(act: unknown): QuizMultiple {
  const raw = asQuizRecord(act);
  if (Array.isArray(raw.preguntas)) {
    return {
      ...(raw as unknown as QuizMultiple),
      tipo: 'quiz_multiple',
      preguntas: raw.preguntas as QuizPregunta[],
      deliveryMode: raw.deliveryMode === 'SYNCED' ? 'SYNCED' : 'AUTONOMOUS',
      layoutVariant:
        typeof raw.layoutVariant === 'string'
          ? (raw.layoutVariant as QuizMultiple['layoutVariant'])
          : 'classic-list',
    };
  }
  const pregunta: QuizPregunta = {
    id: LEGACY_QUIZ_PREGUNTA_ID,
    texto: typeof raw.pregunta === 'string' ? raw.pregunta : '',
    opciones: Array.isArray(raw.opciones) ? (raw.opciones as QuizPregunta['opciones']) : [],
    ...(typeof raw.multipleRespuesta === 'boolean'
      ? { multipleRespuesta: raw.multipleRespuesta }
      : {}),
    ...(typeof raw.puntos === 'number' ? { puntos: raw.puntos } : {}),
    ...(raw.retroalimentacion && typeof raw.retroalimentacion === 'object'
      ? { retroalimentacion: raw.retroalimentacion as QuizPregunta['retroalimentacion'] }
      : {}),
  };
  return {
    tipo: 'quiz_multiple',
    preguntas: [pregunta],
    deliveryMode: 'AUTONOMOUS',
    layoutVariant: 'classic-list',
    ...(typeof raw.shuffleOptions === 'boolean' ? { shuffleOptions: raw.shuffleOptions } : {}),
  };
}

function normalizeActivity(act: Activity): Activity {
  if (act.tipo === 'quiz_multiple') {
    return normalizarQuizMultiple(act);
  }
  if (act.tipo === 'emparejar') {
    return normalizarEmparejar(act);
  }
  if (act.tipo === 'abrir_caja') {
    return normalizarAbrirCaja(act);
  }
  if (act.tipo === 'globos') {
    return normalizarGlobos(act);
  }
  if (act.tipo === 'topo') {
    return normalizarTopo(act);
  }
  if (act.tipo === 'ahorcado') {
    return normalizarAhorcado(act);
  }
  return act;
}

/** Stubs del flyout “Próximamente”: cubren el lienzo (90%) y roban clics a widgets reales. */
export function isUnimplementedInteractiveStub(block: { tipo?: unknown }): boolean {
  return block.tipo === 'interactivo';
}

function withoutInteractiveStubs(bloques: Block[]): Block[] {
  return bloques.filter((b) => !isUnimplementedInteractiveStub(b));
}

function normalizeBlock(block: Block): Block {
  if (block.tipo === 'actividad' && block.actividad.tipo === 'ruleta') {
    return normalizeRuletaBlock(block);
  }
  if (block.tipo === 'actividad') {
    return { ...block, actividad: normalizeActivity(block.actividad) };
  }
  if (block.tipo === 'ruleta') {
    return normalizeRuletaBlock(block);
  }
  if (block.tipo === 'flip-cards') {
    return normalizeFlipCardsWidget(block);
  }
  if (block.tipo === 'tabs') {
    return normalizeTabsWidget(block);
  }
  if (block.tipo === 'carousel') {
    return normalizeCarouselWidget(block);
  }
  if (block.tipo === 'click-reveal') {
    return normalizeClickRevealWidget(block);
  }
  if (block.tipo === 'timeline') {
    return normalizeTimelineWidget(block);
  }
  if (block.tipo === 'popup') {
    return normalizePopupWidget(block);
  }
  if (block.tipo === 'hotspot') {
    return normalizeHotspotWidget(block);
  }
  if (block.tipo === 'tooltip') {
    return normalizeTooltipWidget(block);
  }
  if (block.tipo === 'boton') {
    return normalizeBotonWidget(block);
  }
  if (block.tipo === 'contador') {
    return normalizeContadorWidget(block);
  }
  if (block.tipo === 'progreso') {
    return normalizeProgresoWidget(block);
  }
  if (block.tipo === 'clip-group') {
    return normalizeClipGroupBlock(block);
  }
  if (block.tipo === 'grafico') {
    return normalizeGraficoBlock(block);
  }
  if (block.tipo === 'diagrama') {
    return normalizeDiagramaBlock(block);
  }
  if (block.tipo === 'columnas') {
    return {
      ...block,
      columnas: block.columnas.map((col) => withoutInteractiveStubs(col).map(normalizeBlock)),
    };
  }
  return block;
}

function normalizeBlocks(bloques: Block[]): Block[] {
  return withoutInteractiveStubs(bloques).map(normalizeBlock);
}

/** Convierte el slide tal como viene del API en el tipo `Slide` que usa `SlideRenderer`. */
export function classSlideToRendererSlide(api: ApiSlide): Slide {
  const c = getSlideContentRecord(api);
  const rawBloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  const bloques = normalizeBlocks(rawBloques);
  const temaId = typeof c.temaId === 'string' && c.temaId.length > 0 ? c.temaId : undefined;

  return {
    id: api.id,
    order: api.order,
    type: api.type,
    title: api.title,
    bloques,
    fondo: resolveFondo(c),
    temaId,
    diseno: resolveDiseno(c),
    guias: parseSlideGuias(c.guias),
    transicion: resolveTransicion(c),
    content: null,
  };
}

export function mergeSlideContent(
  api: ApiSlide | null,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base = api ? getSlideContentRecord(api) : {};
  return { ...base, ...patch };
}

/** Une el estado ya normalizado del renderer (`Slide`) con un parche (p. ej. antes de PATCH). */
export function mergeRendererSlideState(
  slide: { bloques?: Block[]; fondo?: Background; diseno?: Layout; guias?: SlideGuias },
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(Array.isArray(slide.bloques) ? { bloques: slide.bloques } : {}),
    ...(slide.fondo ? { fondo: slide.fondo } : {}),
    ...(slide.diseno ? { diseno: slide.diseno } : {}),
    ...(slide.guias ? { guias: slide.guias } : {}),
    ...patch,
  };
}

export function appendBlockToSlideContent(
  api: ApiSlide | null,
  block: Block,
): Record<string, unknown> {
  const c = getSlideContentRecord(api);
  const prev = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  if (isUnimplementedInteractiveStub(block)) {
    return mergeSlideContent(api, { bloques: withoutInteractiveStubs(prev) });
  }
  return mergeSlideContent(api, { bloques: [...withoutInteractiveStubs(prev), block] });
}

/** Una diapositiva de actividad solo contiene ese bloque (sin texto/imagen mezclado). */
export function replaceSlideContentWithSingleActivity(
  api: ApiSlide | null,
  activityBlock: Block,
): Record<string, unknown> {
  return mergeSlideContent(api, {
    bloques: [activityBlock],
    layout: 'titulo_centrado',
    diseno: LAYOUT_FROM_KEY.titulo_centrado,
  });
}

/**
 * Antes de PATCH: quita stubs `interactivo`, hidrata widgets Captivate
 * (mismos `normalize*` que al leer) y, si hay actividad de primer nivel,
 * deja solo esos bloques y fija layout centrado.
 */
export function sanitizeSlideContentForPersistence(content: unknown): Record<string, unknown> | null {
  if (content === null || content === undefined) return null;
  if (typeof content !== 'object' || Array.isArray(content)) return null;
  const c = { ...(content as Record<string, unknown>) };
  const bloques = withoutInteractiveStubs(
    (Array.isArray(c.bloques) ? c.bloques : []) as Block[],
  );
  if (bloques.length === 0) {
    c.bloques = bloques;
    return c;
  }

  const hasTopLevelActivity = bloques.some((b) => b.tipo === 'actividad');
  if (hasTopLevelActivity) {
    c.bloques = normalizeBlocks(bloques.filter((b) => b.tipo === 'actividad'));
    c.layout = 'titulo_centrado';
    c.diseno = LAYOUT_FROM_KEY.titulo_centrado;
  } else {
    c.bloques = normalizeBlocks(bloques);
  }
  return c;
}

/** Documento `content` para POST de un slide nuevo dedicado a una actividad (`orden` lo asigna el caller). */
export function buildContentDocumentForNewActivitySlide(activityBlock: Block): Record<string, unknown> {
  const core = replaceSlideContentWithSingleActivity(null, activityBlock);
  return {
    id: `slide_${Date.now()}`,
    tipo: 'contenido',
    fondo: { tipo: 'color', valor: '#FFFFFF' },
    ...core,
  };
}

/** Obtiene un bloque por la misma ruta que `updateBlockAtPath`. */
export function getBlockAtPath(bloques: Block[], path: string): Block | null {
  const parts = path.split('-').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  function go(arr: Block[], depth: number): Block | null {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return null;
    if (depth === parts.length - 1) return arr[i]!;

    const block = arr[i];
    if (block.tipo !== 'columnas') return null;
    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return null;
    return go(block.columnas[colIdx]!, depth + 2);
  }

  return go(bloques, 0);
}

/** Actualiza un bloque por ruta tipo `"2"` o `"5-0-1"` (columnas anidadas). */
export function updateBlockAtPath(
  bloques: Block[],
  path: string,
  fn: (b: Block) => Block,
): Block[] {
  const parts = path.split('-').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return bloques;

  function go(arr: Block[], depth: number): Block[] {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return arr;

    if (depth === parts.length - 1) {
      return arr.map((b, j) => (j === i ? fn(b) : b));
    }

    const block = arr[i];
    if (block.tipo !== 'columnas') return arr;

    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return arr;

    const newColumnas = block.columnas.map((col: Block[], cj: number) => {
      if (cj !== colIdx) return col;
      return go(col, depth + 2);
    });

    return arr.map((b, j) => (j === i ? { ...block, columnas: newColumnas } : b));
  }

  return go(bloques, 0);
}

/** Elimina el bloque en la ruta (`"2"` o `"5-0-1"`). */
export function removeBlockAtPath(bloques: Block[], path: string): Block[] {
  const parts = path.split('-').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return bloques;

  function go(arr: Block[], depth: number): Block[] {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return arr;

    if (depth === parts.length - 1) {
      return arr.filter((_, j) => j !== i);
    }

    const block = arr[i];
    if (block.tipo !== 'columnas') return arr;

    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return arr;

    const newColumnas = block.columnas.map((col: Block[], cj: number) => {
      if (cj !== colIdx) return col;
      return go(col, depth + 2);
    });

    return arr.map((b, j) => (j === i ? { ...block, columnas: newColumnas } : b));
  }

  return go(bloques, 0);
}
