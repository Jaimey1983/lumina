'use client';

import type { Slide } from '@/types/slide.types';
import { cn } from '@/lib/utils';

// ─── Thumbnail colors by slide type ──────────────────────────────────────────

const THUMB_BG: Record<string, string> = {
  COVER:    'bg-blue-200 dark:bg-blue-800/60',
  CONTENT:  'bg-neutral-200 dark:bg-neutral-700/60',
  ACTIVITY: 'bg-green-200 dark:bg-green-800/60',
  VIDEO:    'bg-purple-200 dark:bg-purple-800/60',
  IMAGE:    'bg-amber-200 dark:bg-amber-800/60',
};

const TYPE_LABEL: Record<string, string> = {
  COVER:    'Portada',
  CONTENT:  'Contenido',
  ACTIVITY: 'Actividad',
  VIDEO:    'Video',
  IMAGE:    'Imagen',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlidesPanelProps {
  slides: Slide[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlidesPanel({ slides, activeIndex, onSelect }: SlidesPanelProps) {
  return (
    <aside className="flex w-44 shrink-0 flex-col overflow-hidden border-r border-border bg-muted/5">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Slides
        </span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {slides.length}
        </span>
      </div>

      {/* Thumbnail list */}
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-2">
        {slides.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Sin slides</p>
        )}

        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const thumbBg = THUMB_BG[slide.type] ?? 'bg-muted';

          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => onSelect(idx)}
              className={cn(
                'w-full overflow-hidden rounded-md border text-left transition-all',
                isActive
                  ? 'border-primary ring-2 ring-primary/25'
                  : 'border-border hover:border-primary/40',
              )}
            >
              {/* Thumbnail rectangle */}
              <div
                className={cn(
                  'flex h-16 items-center justify-center',
                  thumbBg,
                )}
              >
                <span className="font-mono text-xs font-bold text-foreground/40">
                  {slide.order}
                </span>
              </div>

              {/* Slide info */}
              <div className="px-2 py-1">
                <p className="truncate text-[10px] font-medium leading-tight">{slide.title}</p>
                <p className="text-[9px] text-muted-foreground">
                  {TYPE_LABEL[slide.type] ?? slide.type}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
