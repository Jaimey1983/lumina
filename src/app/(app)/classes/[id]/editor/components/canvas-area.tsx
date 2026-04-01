'use client';

import type { Slide } from '@/types/slide.types';
import { SlideRenderer } from './slide-renderer';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CanvasAreaProps {
  slide: Slide | null;
  onBlockSelect: (id: string) => void;
  selectedBlockId: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CanvasArea({ slide, onBlockSelect }: CanvasAreaProps) {
  if (!slide) {
    return (
      <main className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">Sin slide seleccionado</p>
          <p className="text-xs text-muted-foreground">
            Selecciona un slide en el panel lateral o agrega uno nuevo
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-neutral-100 p-8 dark:bg-neutral-900">
      {/* 16:9 slide container — fits both width and height of the available space */}
      <div
        className="relative overflow-hidden rounded-sm shadow-xl"
        style={{
          aspectRatio: '16 / 9',
          width: 'min(100%, calc((100dvh - 8rem) * 16 / 9))',
        }}
      >
        <SlideRenderer
          slide={slide}
          modo="editor"
          onBlockSelect={onBlockSelect}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </main>
  );
}
