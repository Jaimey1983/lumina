/** API pública del bloque ClipGroup (forma vectorial recortada) para `@lumina/element-kit` (E4.3). */
export type {
  Block,
  ClipBorder,
  ClipCompositionFill,
  ClipContent,
  ClipContentColor,
  ClipContentComposicion,
  ClipContentGradient,
  ClipContentImage,
  ClipGroupBlock,
  ClipShadow,
  ClipShape,
  ClipShapeCircle,
  ClipShapeEllipse,
  ClipShapeHexagon,
  ClipShapeKind,
  ClipShapeLibre,
  ClipShapePolygon,
  ClipShapeRect,
  ClipShapeStar,
  ClipShapeSvg,
  ClipShapeTexto,
  ClipShapeTriangle,
  FreeformMaskPath,
  MaskNode,
} from '@/types/slide.types';

export {
  createDefaultClipGroupBlock,
  createTextClipGroupBlock,
  withClipGroupContent,
} from '@/lib/clip-path';

export {
  RenderClipGroup,
  type RenderClipGroupProps,
} from '@/app/(app)/classes/[id]/editor/components/render-clip-group';

export {
  ClipGroupBlockFields as ClipGroupProperties,
} from '@/app/(app)/classes/[id]/editor/components/panels/clip-group-properties';

/**
 * El editor de nodos Bézier (motor Paper.js) NO se re-exporta desde este barrel:
 * `clip-path-node-editor-paper.tsx` importa `paper/dist/paper-core` en el cuerpo
 * del módulo y `paper-core` toca un `<canvas>` 2D al cargar (revienta en jsdom).
 * Vive en el subpath aparte `@/components/clip-group/paper` (E4.4), que solo se
 * carga de forma perezosa.
 */

/** Lógica pura del contorno freeform — la comparte el editor Paper.js y el render SVG. */
export {
  createDefaultFreeformPath,
  createDefaultLibreShape,
  createMaskNodeId,
  freeformPathToSvgD,
  normalizeFreeformPath,
  resolveFreeformPath,
} from '@/lib/freeform-mask';

import type { ClipContent, ClipGroupBlock, ClipShape } from '@/types/slide.types';
import { createDefaultClipGroupBlock } from '@/lib/clip-path';

/** Helper canónico con forma por defecto ('circulo') para `crearPorDefecto` de `ElementDefinition`. */
export function createDefaultClipGroup(
  shape: ClipShape = { tipo: 'circulo' },
  contenido?: ClipContent,
): ClipGroupBlock {
  return createDefaultClipGroupBlock(shape, contenido);
}
