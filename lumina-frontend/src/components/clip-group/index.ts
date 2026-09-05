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

import type { ClipContent, ClipGroupBlock, ClipShape } from '@/types/slide.types';
import { createDefaultClipGroupBlock } from '@/lib/clip-path';

/** Helper canónico con forma por defecto ('circulo') para `crearPorDefecto` de `ElementDefinition`. */
export function createDefaultClipGroup(
  shape: ClipShape = { tipo: 'circulo' },
  contenido?: ClipContent,
): ClipGroupBlock {
  return createDefaultClipGroupBlock(shape, contenido);
}
