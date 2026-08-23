'use client';

import type { WidgetLayoutId } from '@/types/widget.types';
import { cn } from '@/lib/utils';

import { WIDGET_LAYOUTS } from './widget-layouts';
import { WidgetLayoutThumb } from './widget-layout-thumb';

export interface WidgetLayoutGalleryProps {
  activeId: WidgetLayoutId;
  onSelect: (id: WidgetLayoutId) => void;
}

export function WidgetLayoutGallery({ activeId, onSelect }: WidgetLayoutGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {WIDGET_LAYOUTS.map((layout) => {
        const selected = activeId === layout.id;
        return (
          <button
            key={layout.id}
            type="button"
            title={layout.description}
            className={cn(
              'flex flex-col overflow-hidden rounded-lg border text-left transition-colors',
              'hover:border-primary/50 hover:bg-accent/40',
              selected
                ? 'border-primary ring-2 ring-primary/30 bg-accent/30'
                : 'border-border bg-card',
            )}
            onClick={() => onSelect(layout.id)}
          >
            <WidgetLayoutThumb layoutId={layout.id} />
            <span className="px-2 py-1.5 text-[11px] font-medium leading-tight text-foreground">
              {layout.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
