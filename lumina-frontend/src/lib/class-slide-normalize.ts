import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type {
  Activity,
  Background,
  Block,
  Layout,
  QuizMultiple,
  QuizPregunta,
  Slide,
  SlideGuias,
} from '@lumina/types/slide';
import type { TransicionSlide } from '@lumina/types/animation';
import { parseSlideGuias } from '@/lib/canvas-guides';
import { normalizarEmparejar } from '@lumina/element-kit/activities/emparejar/emparejar-config';
import { normalizarQuizMultiple } from '@lumina/element-kit/activities/_classic/quiz-multiple-normalize';
import { normalizarAbrirCaja } from '@lumina/element-kit/activities/abrir-caja/abrir-caja-config';
import { normalizarGlobos } from '@lumina/element-kit/activities/globos/globos-config';
import { normalizarTopo } from '@lumina/element-kit/activities/topo/topo-config';
import { normalizarAhorcado } from '@lumina/element-kit/activities/ahorcado/ahorcado-config';
import { normalizePopupWidget } from '@lumina/element-kit/widgets/popup/popup-defaults';
import { normalizeHotspotWidget } from '@lumina/element-kit/widgets/hotspot/hotspot-defaults';
import { normalizeTooltipWidget } from '@lumina/element-kit/widgets/tooltip/tooltip-defaults';
import { normalizeBotonWidget } from '@lumina/element-kit/widgets/boton/boton-defaults';
import { normalizeContadorWidget } from '@lumina/element-kit/widgets/contador/contador-defaults';
import { normalizeProgresoWidget } from '@lumina/element-kit/widgets/progreso/progreso-defaults';
import { normalizeRuletaBlock } from '@lumina/element-kit/widgets/ruleta/ruleta-defaults';
import { normalizeFlipCardsWidget } from '@lumina/element-kit/widgets/flip-cards/flip-cards-config';
import { normalizeTabsWidget } from '@lumina/element-kit/widgets/tabs/tabs-config';
import { normalizeCarouselWidget } from '@lumina/element-kit/widgets/carousel/carousel-config';
import { normalizeClickRevealWidget } from '@lumina/element-kit/widgets/click-reveal/click-reveal-config';
import { normalizeTimelineWidget } from '@lumina/element-kit/widgets/timeline/timeline-config';
import { normalizeClipGroupBlock } from '@lumina/editor-shared/clip-path';
import { normalizeBackground } from '@/lib/slide-background';
import { normalizeGraficoBlock } from '@lumina/element-kit/blocks/grafico/grafico-defaults';
import { normalizeDiagramaBlock } from '@lumina/element-kit/blocks/diagrama/diagrama-defaults';
import { sanitizeRichDoc, richToPlain, isRichDoc } from '@lumina/editor-shared/rich-text';

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
    return normalizeBackground(f) ?? DEFAULT_FONDO;
  }
  return DEFAULT_FONDO;
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

/**
 * Texto enriquecido (Fase 1): si el bloque trae `contenidoRich`, se sanea y se
 * recomputa `contenido` a partir de él. Si el `RichDoc` es inválido se descarta y
 * el bloque queda como texto plano. Sin `contenidoRich` el bloque no cambia — el
 * relleno perezoso lo hará el editor enriquecido (Fase 2), no la hidratación.
 */
function normalizeTextBlock(block: Extract<Block, { tipo: 'texto' }>): Block {
  if (block.contenidoRich === undefined) return block;
  if (!isRichDoc(block.contenidoRich)) {
    const rest: typeof block = { ...block };
    delete rest.contenidoRich;
    return rest;
  }
  const doc = sanitizeRichDoc(block.contenidoRich);
  return { ...block, contenidoRich: doc, contenido: richToPlain(doc) };
}

function normalizeBlock(block: Block): Block {
  if (block.tipo === 'texto') {
    return normalizeTextBlock(block);
  }
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
    const n = normalizeClipGroupBlock(block);
    if (n.contenido.tipo === 'composicion') {
      return {
        ...n,
        contenido: {
          ...n.contenido,
          bloques: withoutInteractiveStubs(n.contenido.bloques).map(normalizeBlock),
        },
      };
    }
    return n;
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
    contentVersion: api.contentVersion,
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

// E7.6.3-pre: `getBlockAtPath` / `updateBlockAtPath` / `removeBlockAtPath` se
// extrajeron a `@lumina/editor-shared` (los necesita `widgets/shared` sin
// arrastrar el registro de `normalize*`). Se re-exportan para los consumidores
// existentes (`canvas-area`, `properties-panel`, `slide-renderer`,
// `editor-client`, `editor-slide-reducer`).
export {
  getBlockAtPath,
  updateBlockAtPath,
  removeBlockAtPath,
} from '@lumina/editor-shared/slide-block-path';
