import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { ActivityBlock, Background, Block, Layout, Slide } from '@/types/slide.types';

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

/** Una diapositiva de actividad solo contiene ese bloque (sin texto/imagen mezclado). */
export function replaceSlideContentWithSingleActivity(
  api: ApiSlide | null,
  activityBlock: Block,
): Record<string, unknown> {
  let clean = activityBlock;
  if (activityBlock.tipo === 'actividad') {
    const ab = activityBlock as ActivityBlock;
    if (ab.marco != null) {
      const { marco: _m, ...rest } = ab;
      clean = rest as Block;
    }
  }
  return mergeSlideContent(api, {
    bloques: [clean],
    layout: 'titulo_centrado',
    diseno: LAYOUT_FROM_KEY.titulo_centrado,
  });
}

function stripMarcoDeep(block: Block): Block {
  if (block.tipo === 'actividad') {
    const ab = block as ActivityBlock;
    if (ab.marco == null) return block;
    const { marco: _m, ...rest } = ab;
    return rest as Block;
  }
  if (block.tipo === 'columnas') {
    return {
      ...block,
      columnas: block.columnas.map((col) => col.map(stripMarcoDeep)),
    };
  }
  return block;
}

/**
 * Antes de PATCH: quita `marco` obsoleto y, si hay actividad de primer nivel,
 * deja solo esos bloques (como en el renderer) y fija layout centrado.
 */
export function sanitizeSlideContentForPersistence(content: unknown): Record<string, unknown> | null {
  if (content === null || content === undefined) return null;
  if (typeof content !== 'object' || Array.isArray(content)) return null;
  const c = { ...(content as Record<string, unknown>) };
  const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  if (bloques.length === 0) return c;

  const hasTopLevelActivity = bloques.some((b) => b.tipo === 'actividad');
  if (hasTopLevelActivity) {
    c.bloques = bloques.filter((b) => b.tipo === 'actividad').map(stripMarcoDeep);
    c.layout = 'titulo_centrado';
    c.diseno = LAYOUT_FROM_KEY.titulo_centrado;
  } else {
    c.bloques = bloques.map(stripMarcoDeep);
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

    const newColumnas = block.columnas.map((col, cj) => {
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

    const newColumnas = block.columnas.map((col, cj) => {
      if (cj !== colIdx) return col;
      return go(col, depth + 2);
    });

    return arr.map((b, j) => (j === i ? { ...block, columnas: newColumnas } : b));
  }

  return go(bloques, 0);
}

export function applyLayoutPreset(
  api: ApiSlide | null,
  layoutKey: string,
): Record<string, unknown> {
  const key = layoutKey in LAYOUT_FROM_KEY ? layoutKey : FALLBACK_LAYOUT_KEY;
  return mergeSlideContent(api, { layout: key, diseno: LAYOUT_FROM_KEY[key] });
}
