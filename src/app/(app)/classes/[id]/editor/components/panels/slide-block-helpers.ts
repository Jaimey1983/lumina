import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import {
  appendBlockToSlideContent,
  getSlideContentRecord,
  mergeSlideContent,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import type { Block, TextBlock } from '@/types/slide.types';

/** DFS del último bloque `texto` (ruta compatible con `updateBlockAtPath`, p. ej. `2` o `5-0-1`). */
export function findLastTextBlockPath(bloques: Block[], prefixParts: number[] = []): string | null {
  let last: string | null = null;
  for (let i = 0; i < bloques.length; i++) {
    const b = bloques[i]!;
    const here = [...prefixParts, i];
    const path = here.join('-');
    if (b.tipo === 'texto') last = path;
    if (b.tipo === 'columnas') {
      for (let c = 0; c < b.columnas.length; c++) {
        const inner = findLastTextBlockPath(b.columnas[c]!, [...here, c]);
        if (inner) last = inner;
      }
    }
  }
  return last;
}

export type TextTypographyPatch = Partial<
  Pick<TextBlock, 'tamanoFuente' | 'negrita' | 'alineacion'>
>;

/** Aplica tipografía al último bloque texto, o inserta uno nuevo si no hay ninguno. */
export function applyTextTypography(
  apiSlide: ApiSlide | null,
  patch: TextTypographyPatch,
): Record<string, unknown> {
  const c = getSlideContentRecord(apiSlide);
  const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  const path = findLastTextBlockPath(bloques);
  if (path) {
    const next = updateBlockAtPath(bloques, path, (b) =>
      b.tipo === 'texto' ? { ...b, ...patch } : b,
    );
    return mergeSlideContent(apiSlide, { bloques: next });
  }
  return appendBlockToSlideContent(apiSlide, {
    tipo: 'texto',
    contenido: 'Texto',
    ...patch,
  });
}

/** Último bloque texto (para reflejar estado activo en la UI). */
export function getLastTextBlock(bloques: Block[]): TextBlock | null {
  const path = findLastTextBlockPath(bloques);
  if (!path) return null;
  const parts = path.split('-').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  function walk(arr: Block[], depth: number): TextBlock | null {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return null;
    const b = arr[i]!;
    if (depth === parts.length - 1) {
      return b.tipo === 'texto' ? b : null;
    }
    if (b.tipo !== 'columnas') return null;
    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= b.columnas.length) return null;
    return walk(b.columnas[colIdx]!, depth + 2);
  }

  return walk(bloques, 0);
}

export function svgImageDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
