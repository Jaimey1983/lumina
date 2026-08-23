import type { CSSProperties } from 'react';

import type { WidgetImagenAjuste } from '@/types/widget.types';

/** Esquinas redondeadas del contenedor de imagen según layout split. */
export type ImageWrapperCornerMode = 'all' | 'split-left' | 'split-right';

export function imageWrapperStyle(
  imagen: WidgetImagenAjuste,
  fallbackRadius = 0,
  cornerMode: ImageWrapperCornerMode = 'all',
): CSSProperties {
  const radius = imagen.imagenRadio ?? Math.max(0, fallbackRadius - 2);
  const base: CSSProperties = { overflow: 'hidden' };

  switch (cornerMode) {
    case 'split-left':
      return {
        ...base,
        borderTopLeftRadius: radius,
        borderBottomLeftRadius: radius,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      };
    case 'split-right':
      return {
        ...base,
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      };
    default:
      return {
        ...base,
        borderRadius: radius,
      };
  }
}

export function getCoverScale(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
): number {
  if (!imgNaturalWidth || !imgNaturalHeight || !containerWidth || !containerHeight) {
    return 1;
  }
  const scaleX = containerWidth / imgNaturalWidth;
  const scaleY = containerHeight / imgNaturalHeight;
  return Math.max(scaleX, scaleY);
}

export function imageFilterStyle(imagen: WidgetImagenAjuste): {
  opacity: number;
  filter?: string;
} {
  const brightness = imagen.imagenBrillo ?? 100;
  const filters: string[] = [];
  if (brightness !== 100) {
    filters.push(`brightness(${brightness / 100})`);
  }
  if (imagen.imagenEscalaDeGrises) {
    filters.push('grayscale(100%)');
  }
  return {
    opacity: (imagen.imagenOpacidad ?? 100) / 100,
    filter: filters.length ? filters.join(' ') : undefined,
  };
}

/** Umbral por debajo del cual se trata el contenedor como miniatura. */
export const WIDGET_IMAGE_THUMBNAIL_THRESHOLD = 50;

export function isThumbnailContainer(containerDims: {
  w: number;
  h: number;
}): boolean {
  return (
    containerDims.w < WIDGET_IMAGE_THUMBNAIL_THRESHOLD ||
    containerDims.h < WIDGET_IMAGE_THUMBNAIL_THRESHOLD
  );
}

export function imageThumbnailStyle(imagen: WidgetImagenAjuste): CSSProperties {
  return {
    ...imageLoadingFallbackStyle(),
    objectPosition: 'center',
    ...imageFilterStyle(imagen),
  };
}

/** Fallback mientras la imagen o el contenedor aún no tienen dimensiones. */
export function imageLoadingFallbackStyle(): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
  };
}

/**
 * Dimensiones reales de la imagen (equivalente a object-fit: cover) sin recortar
 * el bitmap antes del pan/zoom. El contenedor recorta con overflow: hidden.
 */
export function getImageStyle(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  escala: number,
  offsetX: number,
  offsetY: number,
  extras?: { opacity?: number; filter?: string },
): CSSProperties {
  if (
    !imgNaturalWidth ||
    !imgNaturalHeight ||
    !containerWidth ||
    !containerHeight
  ) {
    return {
      ...imageLoadingFallbackStyle(),
      objectPosition: 'center',
      opacity: extras?.opacity,
      filter: extras?.filter,
    };
  }

  const coverScale = getCoverScale(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
  );
  const finalWidth = imgNaturalWidth * coverScale * escala;
  const finalHeight = imgNaturalHeight * coverScale * escala;

  return {
    position: 'absolute',
    width: `${finalWidth}px`,
    height: `${finalHeight}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    top: `${(containerHeight - finalHeight) / 2 + offsetY}px`,
    left: `${(containerWidth - finalWidth) / 2 + offsetX}px`,
    right: 'auto',
    bottom: 'auto',
    opacity: extras?.opacity,
    filter: extras?.filter,
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
  };
}

export function usesComputedImageLayout(
  imgDims: { w: number; h: number },
  containerDims: { w: number; h: number },
  options?: { isThumbnail?: boolean },
): boolean {
  return !(
    options?.isThumbnail ||
    isThumbnailContainer(containerDims) ||
    imgDims.w <= 0 ||
    imgDims.h <= 0 ||
    containerDims.w <= 0 ||
    containerDims.h <= 0
  );
}

export function imageElementStyle(
  imagen: WidgetImagenAjuste,
  imgDims: { w: number; h: number },
  containerDims: { w: number; h: number },
  overrides?: { offsetX?: number; offsetY?: number },
  options?: { isThumbnail?: boolean },
): CSSProperties {
  if (!usesComputedImageLayout(imgDims, containerDims, options)) {
    return {
      ...imageLoadingFallbackStyle(),
      objectPosition: 'center',
      ...imageFilterStyle(imagen),
    };
  }

  const escala = (imagen.imagenEscala ?? 100) / 100;
  const offsetX = overrides?.offsetX ?? imagen.imagenOffsetX ?? 0;
  const offsetY = overrides?.offsetY ?? imagen.imagenOffsetY ?? 0;

  return getImageStyle(
    imgDims.w,
    imgDims.h,
    containerDims.w,
    containerDims.h,
    escala,
    offsetX,
    offsetY,
    imageFilterStyle(imagen),
  );
}

/**
 * Calcula el clamp de pan en px a partir del tamaño natural de la imagen
 * y las dimensiones del contenedor.
 */
export function applyImageElementStyle(
  img: HTMLImageElement,
  imagen: WidgetImagenAjuste,
  imgDims: { w: number; h: number },
  containerDims: { w: number; h: number },
  overrides?: { offsetX?: number; offsetY?: number },
  options?: { isThumbnail?: boolean },
): void {
  const style = imageElementStyle(imagen, imgDims, containerDims, overrides, options);
  Object.assign(img.style, style);
}

export function computeImagePanClamp(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  scale: number,
): { maxPanX: number; maxPanY: number } {
  const natW = naturalWidth || containerWidth;
  const natH = naturalHeight || containerHeight;
  const coverScale = getCoverScale(natW, natH, containerWidth, containerHeight);
  const renderedW = natW * coverScale * scale;
  const renderedH = natH * coverScale * scale;

  return {
    maxPanX: Math.max(0, (renderedW - containerWidth) / 2),
    maxPanY: Math.max(0, (renderedH - containerHeight) / 2),
  };
}
