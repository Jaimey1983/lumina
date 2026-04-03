'use client';

import { Presentation } from 'lucide-react';

import type { Activity, Slide } from '@/types/slide.types';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorToolbar } from './editor-toolbar';
import { SlideRenderer } from './slide-renderer';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CanvasAreaProps {
  slide: Slide | null;
  isLoading?: boolean;
  onBlockSelect?: (id: string) => void;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/** Marco del slide: dimensiones vía CSS vars (--editor-slide-*) en globals.css */
const SLIDE_FRAME_CLASS = cn(
  'relative aspect-video w-full max-w-[var(--editor-slide-max-w)] max-h-[var(--editor-slide-max-h)] shrink-0 overflow-hidden',
  'rounded-md border border-border bg-card shadow-md',
);

export function CanvasArea({
  slide,
  isLoading,
  onBlockSelect,
  onActivityChange,
  onRemoveBlock,
}: CanvasAreaProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end overflow-hidden',
        'bg-editor-workspace px-4 pb-2 pt-[var(--editor-canvas-pt)] md:px-6 md:pb-2 md:pt-[var(--editor-canvas-pt-md)]',
      )}
    >
      <div
        className={cn(
          'absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1',
          'top-[var(--editor-toolbar-top)] md:top-[var(--editor-toolbar-top-md)]',
          'rounded-md border border-border bg-card px-2 py-1 shadow-sm',
          'motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:ease-out',
          'motion-reduce:transition-none',
        )}
      >
        <EditorToolbar />
      </div>

      {isLoading ? (
        <div className={SLIDE_FRAME_CLASS}>
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      ) : slide ? (
        <div className={SLIDE_FRAME_CLASS}>
          <SlideRenderer
            slide={slide}
            modo="editor"
            onBlockSelect={onBlockSelect}
            onActivityChange={onActivityChange}
            onRemoveBlock={onRemoveBlock}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : (
        <div className="flex w-full max-w-[var(--editor-slide-max-w)] flex-col items-center gap-3 pb-2 text-center">
          <Presentation
            className="size-10 shrink-0 text-muted-foreground/80"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Sin slides</p>
            <p className="text-xs text-muted-foreground">
              Agrega slides desde el panel lateral
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
