'use client';

import { cn } from '@/lib/utils';

import type { FlipCardsPlantillaId } from './flip-cards-config';
import { FLIP_CARDS_PLANTILLAS } from './flip-cards-templates';
import { FlipCardsTemplateThumb } from './flip-cards-template-thumb';

export interface FlipCardsTemplateGalleryProps {
  activeId: FlipCardsPlantillaId;
  onSelect: (id: FlipCardsPlantillaId) => void;
}

export function FlipCardsTemplateGallery({
  activeId,
  onSelect,
}: FlipCardsTemplateGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FLIP_CARDS_PLANTILLAS.map((tpl) => {
        const selected = activeId === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            title={tpl.description}
            className={cn(
              'flex flex-col overflow-hidden rounded-lg border text-left transition-colors',
              'hover:border-primary/50 hover:bg-accent/40',
              selected
                ? 'border-primary ring-2 ring-primary/30 bg-accent/30'
                : 'border-border bg-card',
            )}
            onClick={() => onSelect(tpl.id)}
          >
            <FlipCardsTemplateThumb plantillaId={tpl.id} />
            <span className="px-2 py-1.5 text-[11px] font-medium leading-tight text-foreground">
              {tpl.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
