import type { FlipCardCara } from '@lumina/types/slide';

import {
  imageElementStyle as baseImageElementStyle,
  imageWrapperStyle as baseImageWrapperStyle,
} from '@lumina/editor-shared/widget-image-styles';

export function imageWrapperStyle(cara: FlipCardCara, cardRadius: number) {
  return baseImageWrapperStyle(cara, cardRadius);
}

export function imageElementStyle(
  cara: FlipCardCara,
  imgDims: { w: number; h: number },
  containerDims: { w: number; h: number },
  overrides?: { offsetX?: number; offsetY?: number },
  options?: Parameters<typeof baseImageElementStyle>[4],
) {
  return baseImageElementStyle(cara, imgDims, containerDims, overrides, options);
}
