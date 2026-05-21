import type { FlipCardCara } from '@/types/slide.types';

export function imageWrapperStyle(cara: FlipCardCara, cardRadius: number): React.CSSProperties {
  return {
    borderRadius: cara.imagenRadio ?? Math.max(0, cardRadius - 2),
  };
}

export function imageElementStyle(cara: FlipCardCara): React.CSSProperties {
  const brightness = cara.imagenBrillo ?? 100;
  const filters: string[] = [];
  if (brightness !== 100) {
    filters.push(`brightness(${brightness / 100})`);
  }
  if (cara.imagenEscalaDeGrises) {
    filters.push('grayscale(100%)');
  }
  const scale = (cara.imagenEscala ?? 100) / 100;
  const offsetX = cara.imagenOffsetX ?? 0;
  const offsetY = cara.imagenOffsetY ?? 0;
  return {
    objectFit: cara.imagenObjectFit ?? 'cover',
    objectPosition: cara.imagenObjectPosition ?? 'center',
    opacity: (cara.imagenOpacidad ?? 100) / 100,
    width: '100%',
    height: '100%',
    transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
    transformOrigin: 'center center',
    filter: filters.length ? filters.join(' ') : undefined,
  };
}
