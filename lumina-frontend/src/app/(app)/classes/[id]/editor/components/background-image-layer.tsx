'use client';

import type { BackgroundImage } from '@/types/slide.types';
import {
  backgroundAjusteToObjectFit,
  backgroundRotatedLayerSize,
} from '@/lib/slide-background';
import { cn } from '@/lib/utils';

export interface BackgroundImageLayerProps {
  fondo: Pick<BackgroundImage, 'url' | 'ajuste' | 'rotacion' | 'posicion'>;
  className?: string;
}

/**
 * Capa `<img>` absoluta para fondos de imagen: respeta rotación (0/90/180/270),
 * ajuste (object-fit) y posición/pan (object-position). Única fuente de esta
 * pintura — antes triplicada entre `slide-renderer.tsx` (editor/viewer y
 * preview) y la vista previa de `design-background-popover.tsx`.
 */
export function BackgroundImageLayer({ fondo, className }: BackgroundImageLayerProps) {
  const rotacion = fondo.rotacion ?? 0;
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          ...backgroundRotatedLayerSize(rotacion),
          transform: `translate(-50%, -50%) rotate(${rotacion}deg)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fondo.url}
          alt=""
          className="size-full"
          style={{
            objectFit: backgroundAjusteToObjectFit(fondo.ajuste),
            objectPosition: fondo.posicion ?? '50% 50%',
          }}
        />
      </div>
    </div>
  );
}
