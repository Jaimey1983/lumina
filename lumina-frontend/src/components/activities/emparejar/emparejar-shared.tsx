'use client';

import type { EmparejaLado } from '@/types/slide.types';
import { cn } from '@/lib/utils';

interface RenderLadoProps {
  lado: EmparejaLado;
  textClassName?: string;
  imageClassName?: string;
}

export function RenderLado({ lado, textClassName, imageClassName }: RenderLadoProps) {
  if (lado.imagen) {
    return (
      <img
        src={lado.imagen}
        alt={lado.texto ?? ''}
        className={cn('w-full h-full object-cover rounded', imageClassName)}
      />
    );
  }
  if (lado.texto) {
    return (
      <span className={cn('text-xs text-gray-700 text-center', textClassName)}>
        {lado.texto}
      </span>
    );
  }
  return null;
}
