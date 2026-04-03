import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Background, Block, Layout, Slide } from '@/types/slide.types';

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
  titulo_y_contenido: { columnas: 1, brecha: 16, relleno: 24 },
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

function resolveFondo(c: Record<string, unknown>): Background | undefined {
  const f = c.fondo;
  if (f && typeof f === 'object' && !Array.isArray(f) && 'tipo' in f) {
    return f as Background;
  }
  return DEFAULT_FONDO;
}

/** Convierte el slide tal como viene del API en el tipo `Slide` que usa `SlideRenderer`. */
export function classSlideToRendererSlide(api: ApiSlide): Slide {
  const c = getSlideContentRecord(api);
  const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  return {
    id: api.id,
    order: api.order,
    type: api.type,
    title: api.title,
    bloques,
    fondo: resolveFondo(c),
    diseno: resolveDiseno(c),
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

export function appendBlockToSlideContent(
  api: ApiSlide | null,
  block: Block,
): Record<string, unknown> {
  const c = getSlideContentRecord(api);
  const prev = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  return mergeSlideContent(api, { bloques: [...prev, block] });
}

export function applyLayoutPreset(
  api: ApiSlide | null,
  layoutKey: string,
): Record<string, unknown> {
  const key = layoutKey in LAYOUT_FROM_KEY ? layoutKey : FALLBACK_LAYOUT_KEY;
  return mergeSlideContent(api, { layout: key, diseno: LAYOUT_FROM_KEY[key] });
}
