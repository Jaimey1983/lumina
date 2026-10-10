'use client';

import type { Background } from '@lumina/types/slide';
import { DesignBackgroundPopover } from '../design-background-popover';
import { getSlideContentRecord } from '@/lib/class-slide-normalize';
import { ScrollArea } from '@lumina/ui/scroll-area';
import type { ContentPanelProps } from './panel-shared';

export function FondoPanel({
  apiSlide,
  disabled,
  onChangeFondo,
}: ContentPanelProps & { onChangeFondo: (fondo: Background) => Promise<void> }) {
  const c = getSlideContentRecord(apiSlide);
  const fondo = (c.fondo as Background) ?? undefined;

  // Misma vía que la barra flotante (CanvasArea.changeFondo): snapshot →
  // PATCH → historial Ctrl+Z. `handleChangeFondo` ya hace el toast.
  const handleApply = (nextFondo: Background) => {
    void onChangeFondo(nextFondo);
  };

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="p-3">
        <DesignBackgroundPopover
          fondo={fondo}
          disabled={disabled}
          onApply={handleApply}
        />
      </div>
    </ScrollArea>
  );
}
