import type { FlipCardCara } from '@/types/slide.types';

import {
  imageElementStyle as baseImageElementStyle,
  imageWrapperStyle as baseImageWrapperStyle,
} from '@/components/widgets/shared/widget-image-styles';

export function imageWrapperStyle(cara: FlipCardCara, cardRadius: number) {
  return baseImageWrapperStyle(cara, cardRadius);
}

export function imageElementStyle(cara: FlipCardCara) {
  return baseImageElementStyle(cara);
}
