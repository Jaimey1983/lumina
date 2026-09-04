'use client';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getSlideContentRecord } from '@/lib/class-slide-normalize';
import { SLIDE_LAYOUT_ORDER, type SlidePersistedLayoutKey } from './templates-panel';
import { LayoutThumbnail } from './layout-thumbnails';

export interface LayoutPanelProps {
  apiSlide: ApiSlide | null;
  disabled?: boolean;
  onApplyLayout: (layoutKey: SlidePersistedLayoutKey) => void;
  applyLayoutPending?: boolean;
}

export function LayoutPanel({
  apiSlide,
  disabled,
  onApplyLayout,
  applyLayoutPending,
}: LayoutPanelProps) {
  const current =
    typeof getSlideContentRecord(apiSlide).layout === 'string'
      ? (getSlideContentRecord(apiSlide).layout as string)
      : 'titulo_y_contenido';

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-2 p-3 pr-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layout</p>

        <div className="grid grid-cols-2 gap-2">
          {SLIDE_LAYOUT_ORDER.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={disabled || !!applyLayoutPending}
              onClick={() => onApplyLayout(key)}
              aria-pressed={current === key}
              className={cn(
                'flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border bg-card p-1.5 text-left',
                'transition-colors hover:border-primary/40 hover:bg-accent',
                current === key
                  ? 'border-primary ring-1 ring-primary/20'
                  : 'border-border',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              <div className="aspect-video w-full overflow-hidden rounded-md border border-border/60 bg-muted/40">
                <LayoutThumbnail layoutKey={key} />
              </div>
              <p className="min-w-0 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-foreground">
                {label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
