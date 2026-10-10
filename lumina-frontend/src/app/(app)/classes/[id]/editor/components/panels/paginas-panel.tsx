'use client';

import { BookOpen } from 'lucide-react';
import {
  getSlideContentRecord,
  sanitizeSlideContentForPersistence,
} from '@/lib/class-slide-normalize';
import { SLIDE_TIMER_PER_SLIDE_OPTIONS } from '@/lib/slide-timer-resolve';
import { Label } from '@lumina/ui/label';
import { ScrollArea } from '@lumina/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumina/ui/select';
import { cn } from '@/lib/utils';
import { PanelSection } from './panel-shared';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';

export interface PaginasPanelProps {
  slides: { id: string; order: number; title: string; type: string }[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  apiSlide: ApiSlide | null;
  /** Contenido completo a persistir en PATCH (merge del JSON `content`). */
  onCommitContent: (content: Record<string, unknown>) => void;
  busy?: boolean;
}

export function PaginasPanel({
  slides,
  activeSlideIndex,
  onSelectSlide,
  apiSlide,
  onCommitContent,
  busy,
}: PaginasPanelProps) {
  const c = apiSlide ? getSlideContentRecord(apiSlide) : {};
  const rawTimer = c.timer;
  const selectValue =
    rawTimer === undefined || rawTimer === null || rawTimer === ''
      ? 'inherit'
      : String(rawTimer);

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-1 p-3 pr-2">
        {apiSlide && (
          <PanelSection
            title="Temporizador (en vivo)"
            className="mb-3"
            storageKey="paginas.temporizador"
            defaultOpen={false}
            badge={
              selectValue === 'inherit'
                ? undefined
                : SLIDE_TIMER_PER_SLIDE_OPTIONS.find((o) => o.value === selectValue)?.label
            }
          >
            <Label className="text-[11px] text-muted-foreground">Tiempo del slide</Label>
            <Select
              value={selectValue}
              disabled={busy}
              onValueChange={(v) => {
                const base = getSlideContentRecord(apiSlide);
                const next: Record<string, unknown> = { ...base };
                if (v === 'inherit') {
                  delete next.timer;
                } else {
                  next.timer = Number(v);
                }
                const sanitized = sanitizeSlideContentForPersistence(next) ?? next;
                onCommitContent(sanitized);
              }}
            >
              <SelectTrigger className="h-8 text-xs" size="sm">
                <SelectValue placeholder="Usar tiempo global" />
              </SelectTrigger>
              <SelectContent>
                {SLIDE_TIMER_PER_SLIDE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Vacío = usa el temporizador global de la clase. 0 = sin temporizador en este slide.
            </p>
          </PanelSection>
        )}

        <p className="mb-2 text-xs text-muted-foreground">
          {slides.length} slide{slides.length === 1 ? '' : 's'} en esta clase.
        </p>
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectSlide(idx)}
            className={cn(
              'flex w-full items-start gap-2 rounded-md border px-2 py-2 text-left text-xs transition-colors',
              idx === activeSlideIndex
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-transparent bg-muted/30 hover:bg-muted/60',
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-background text-xs font-medium tabular-nums text-muted-foreground">
              {idx + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-medium">{s.title || `Slide ${idx + 1}`}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{s.type}</span>
            </span>
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground opacity-50" aria-hidden />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
