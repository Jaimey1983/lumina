'use client';

import { Circle, Hexagon, PenLine, Sparkles, Square, Star, Triangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { createDefaultClipGroupBlock } from '@/lib/clip-path';
import {
  createDefaultLibreShape,
  createEmptyFreeformPath,
} from '@/lib/freeform-mask';
import { appendBlockToSlideContent } from '@/lib/class-slide-normalize';
import type { Block, ClipShape } from '@/types/slide.types';
import { cn } from '@/lib/utils';

interface MaskItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  shape: ClipShape;
}

const MASK_ITEMS: MaskItem[] = [
  {
    id: 'rect',
    label: 'Rectángulo',
    Icon: Square,
    shape: { tipo: 'rectangulo', borderRadius: 8 },
  },
  {
    id: 'circle',
    label: 'Círculo',
    Icon: Circle,
    shape: { tipo: 'circulo' },
  },
  {
    id: 'triangle',
    label: 'Triángulo',
    Icon: Triangle,
    shape: { tipo: 'triangulo' },
  },
  {
    id: 'star',
    label: 'Estrella',
    Icon: Star,
    shape: { tipo: 'estrella', puntas: 5, radioInterno: 0.4 },
  },
  {
    id: 'hex',
    label: 'Hexágono',
    Icon: Hexagon,
    shape: { tipo: 'hexagono' },
  },
  {
    id: 'ellipse',
    label: 'Elipse',
    Icon: Sparkles,
    shape: { tipo: 'elipse' },
  },
  {
    id: 'libre',
    label: 'Forma libre',
    Icon: PenLine,
    shape: createDefaultLibreShape(),
  },
  {
    id: 'libre-draw',
    label: 'Forma libre (dibujar)',
    Icon: PenLine,
    shape: { tipo: 'libre', path: createEmptyFreeformPath() },
  },
];

interface Props {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function ClipMasksPanel({ apiSlide, onCommitContent, disabled }: Props) {
  const addMask = (shape: ClipShape) => {
    const block: Block = createDefaultClipGroupBlock(shape);
    onCommitContent(appendBlockToSlideContent(apiSlide, block));
    toast.success('Máscara añadida al slide');
  };

  return (
    <div className="space-y-3 border-b border-border pb-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Máscaras de recorte
      </p>
      <p className="px-1 text-[11px] leading-snug text-muted-foreground">
        Recorta imagen o color. Forma libre: arrastra nodos; doble clic o Alt+arrastra un nodo para sacar manijas Bézier; clic en el borde añade nodo; Alt+clic/Supr elimina.
      </p>
      <div className="grid grid-cols-2 gap-1.5 px-1">
        {MASK_ITEMS.map(({ id, label, Icon, shape }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => addMask(shape)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-3 text-[10px] transition-colors',
              disabled
                ? 'cursor-not-allowed opacity-40'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
