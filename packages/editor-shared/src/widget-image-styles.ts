import type { CSSProperties } from 'react';

import type { WidgetImagenAjuste } from '@lumina/types/widget';

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
  const extras = imageFilterStyle(imagen);

  // Preview en vivo del arrastre: `overrides` son px de pan directos (el editor
  // muta el DOM en cada movimiento). Se re-clampan al pan máximo del contenedor.
  if (
    overrides &&
    (overrides.offsetX !== undefined || overrides.offsetY !== undefined)
  ) {
    const { maxPanX, maxPanY } = computeImagePanClamp(
      imgDims.w,
      imgDims.h,
      containerDims.w,
      containerDims.h,
      escala,
    );
    const px = Math.min(Math.max(overrides.offsetX ?? 0, -maxPanX), maxPanX);
    const py = Math.min(Math.max(overrides.offsetY ?? 0, -maxPanY), maxPanY);
    return getImageStyle(
      imgDims.w,
      imgDims.h,
      containerDims.w,
      containerDims.h,
      escala,
      px,
      py,
      extras,
    );
  }

  // Render normal: los offsets guardados (imagenOffsetX/Y) son % del contenedor,
  // igual que en clip-group e image-compare. framedCoverStyle los convierte a px
  // según el tamaño real de render y re-clampa → encuadre idéntico en editor,
  // viewer y móvil, e invariante al tamaño en px del canvas (zoom/rail).
  return framedCoverStyle(
    imgDims.w,
    imgDims.h,
    containerDims.w,
    containerDims.h,
    escala,
    imagen.imagenOffsetX ?? 0,
    imagen.imagenOffsetY ?? 0,
    extras,
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

/**
 * Estilo cover con desplazamiento de encuadre expresado como **porcentaje del
 * contenedor** (no px absolutos). Convierte el % a px según el tamaño real de
 * render y lo limita al pan máximo del contenedor.
 *
 * Esto lo hace independiente de la resolución: el mismo % produce el mismo
 * encuadre en el editor, el viewer y en móvil, sin importar el tamaño en píxeles
 * del contenedor (que cambia con el zoom del canvas, el ancho disponible del
 * editor o el dispositivo). Pasar offsets en px absolutos a `getImageStyle`
 * descuadra el recorte y puede dejar franjas en blanco al renderizar en un
 * contenedor de distinto tamaño al de edición.
 */
export function framedCoverStyle(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  escala: number,
  offsetXPercent: number,
  offsetYPercent: number,
  extras?: { opacity?: number; filter?: string },
): CSSProperties {
  if (
    !imgNaturalWidth ||
    !imgNaturalHeight ||
    !containerWidth ||
    !containerHeight
  ) {
    return getImageStyle(
      imgNaturalWidth,
      imgNaturalHeight,
      containerWidth,
      containerHeight,
      escala,
      0,
      0,
      extras,
    );
  }

  const { maxPanX, maxPanY } = computeImagePanClamp(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
    escala,
  );
  const rawX = (offsetXPercent / 100) * containerWidth;
  const rawY = (offsetYPercent / 100) * containerHeight;
  const px = Math.min(Math.max(rawX, -maxPanX), maxPanX);
  const py = Math.min(Math.max(rawY, -maxPanY), maxPanY);

  return getImageStyle(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
    escala,
    px,
    py,
    extras,
  );
}

/**
 * Desplazamiento de pan en px (respecto al centro) → % del contenedor.
 * Usar al persistir un arrastre para que el valor guardado sea portable entre
 * tamaños de render. Redondea a 1 decimal.
 */
export function panPxToContainerPercent(
  px: number,
  containerDim: number,
): number {
  if (!containerDim) return 0;
  return Math.round((px / containerDim) * 1000) / 10;
}

/**
 * % del contenedor → px de pan, para inicializar un arrastre desde el valor
 * guardado con el tamaño de contenedor actual.
 */
export function containerPercentToPanPx(
  percent: number,
  containerDim: number,
): number {
  return (percent / 100) * containerDim;
}
