import type { CSSProperties } from 'react';

import type { WidgetImagenAjuste } from '@/types/widget.types';

export function imageWrapperStyle(
  imagen: WidgetImagenAjuste,
  fallbackRadius = 0,
): CSSProperties {
  return {
    borderRadius: imagen.imagenRadio ?? Math.max(0, fallbackRadius - 2),
  };
}

export function imageElementStyle(imagen: WidgetImagenAjuste): CSSProperties {
  const brightness = imagen.imagenBrillo ?? 100;
  const filters: string[] = [];
  if (brightness !== 100) {
    filters.push(`brightness(${brightness / 100})`);
  }
  if (imagen.imagenEscalaDeGrises) {
    filters.push('grayscale(100%)');
  }
  const scale = (imagen.imagenEscala ?? 100) / 100;
  const offsetX = imagen.imagenOffsetX ?? 0;
  const offsetY = imagen.imagenOffsetY ?? 0;
  const transforms: string[] = [];
  if (offsetX !== 0 || offsetY !== 0) {
    transforms.push(`translate(${offsetX}%, ${offsetY}%)`);
  }
  if (scale !== 1) {
    transforms.push(`scale(${scale})`);
  }
  return {
    objectFit: imagen.imagenObjectFit ?? 'cover',
    objectPosition: imagen.imagenObjectPosition ?? 'center center',
    opacity: (imagen.imagenOpacidad ?? 100) / 100,
    width: '100%',
    height: '100%',
    transform: transforms.length ? transforms.join(' ') : undefined,
    transformOrigin: 'center center',
    filter: filters.length ? filters.join(' ') : undefined,
  };
}
