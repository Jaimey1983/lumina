'use client';

import { Loader2, Plus } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SLIDE_LABELS } from '@/config/slide.constants';

// ─── Local slide interface (compatible with API Slide type) ───────────────────

interface SlideItem {
  id: string;
  order: number;
  type: string;
  title: string;
}

// ─── Thumbnail colors by slide type ──────────────────────────────────────────

const THUMB_BG: Record<string, string> = {
  COVER:    'bg-violet-100 dark:bg-violet-900/40',
  CONTENT:  'bg-blue-100  dark:bg-blue-900/40',
  ACTIVITY: 'bg-amber-100 dark:bg-amber-900/40',
  VIDEO:    'bg-rose-100  dark:bg-rose-900/40',
  IMAGE:    'bg-emerald-100 dark:bg-emerald-900/40',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlidesPanelProps {
  slides: SlideItem[];
  activeIndex: number;
  isLoading?: boolean;
  isAddingSlide?: boolean;
  onSelect: (index: number) => void;
  onAddSlide: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlidesPanel({
  slides,
  activeIndex,
  isLoading,
  isAddingSlide,
  onSelect,
  onAddSlide,
}: SlidesPanelProps) {
  return (
    <aside className="relative z-0 flex h-full min-h-0 min-w-0 w-full shrink-0 flex-col overflow-hidden border-r border-border bg-background">

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
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-md" />
          ))}

        {!isLoading && slides.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Sin slides</p>
        )}

        {!isLoading &&
          slides.map((slide, idx) => {
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
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50',
                )}
              >
                {/* Thumbnail — aspect ratio 16/9 */}
                <div
                  className={cn('flex items-center justify-center', thumbBg)}
                  style={{ aspectRatio: '16/9' }}
                >
                  <span className="font-mono text-sm font-bold text-foreground/30">
                    {slide.order}
                  </span>
                </div>
                {/* Label */}
                <div className="px-2 py-1.5">
                  <p className="truncate text-[10px] font-medium leading-tight">{slide.title}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {SLIDE_LABELS[slide.type] ?? slide.type}
                  </p>
                </div>
              </button>
            );
          })}
      </div>

      {/* Agregar slide */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          disabled={isAddingSlide}
          onClick={onAddSlide}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-md border border-border',
            'bg-background py-2 text-xs font-medium text-muted-foreground',
            'transition-colors hover:border-primary/60 hover:bg-accent hover:text-primary',
            isAddingSlide && 'cursor-not-allowed opacity-50',
          )}
        >
          {isAddingSlide ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          {isAddingSlide ? 'Creando…' : 'Agregar slide'}
        </button>
      </div>

    </aside>
  );
}
