import type { FlipCardCara } from '@/types/slide.types';

import {
  imageElementStyle as baseImageElementStyle,
  imageThumbnailStyle,
  imageWrapperStyle as baseImageWrapperStyle,
} from '@/components/widgets/shared/widget-image-styles';

export function imageWrapperStyle(cara: FlipCardCara, cardRadius: number) {
  return baseImageWrapperStyle(cara, cardRadius);
}

export function imageElementStyle(
  cara: FlipCardCara,
  imgDims: { w: number; h: number },
  containerDims: { w: number; h: number },
  overrides?: { offsetX?: number; offsetY?: number },
  options?: { isThumbnail?: boolean },
) {
  if (options?.isThumbnail) {
    return imageThumbnailStyle(cara);
  }
  return baseImageElementStyle(cara, imgDims, containerDims, overrides, options);
}

export { imageThumbnailStyle };
