'use client';

import { Circle, Minus, Square, Triangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block, DividerBlock, ImageBlock } from '@/types/slide.types';
import { appendBlockToSlideContent } from '@/lib/class-slide-normalize';
import { cn } from '@/lib/utils';

import { svgImageDataUrl } from './slide-block-helpers';

type ShapeKind = 'rect' | 'circle' | 'triangle' | 'line';

interface ShapeItem {
  kind: ShapeKind;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: ShapeItem[] = [
  { kind: 'rect', label: 'Rectángulo', Icon: Square },
  { kind: 'circle', label: 'Círculo', Icon: Circle },
  { kind: 'triangle', label: 'Triángulo', Icon: Triangle },
  { kind: 'line', label: 'Línea', Icon: Minus },
];

interface Props {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
}

function shapeToBlock(kind: ShapeKind): Block {
  if (kind === 'line') {
    const sep: DividerBlock = {
      tipo: 'separador',
      estilo: 'solido',
      color: '#64748b',
      grosor: 2,
    };
    return sep;
  }

  const stroke = '#475569';
  const fill = '#94a3b8';

  let svg: string;
  if (kind === 'rect') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><rect x="8" y="8" width="224" height="124" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="4"/></svg>`;
  } else if (kind === 'circle') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><circle cx="120" cy="70" r="56" fill="${fill}" stroke="${stroke}" stroke-width="4"/></svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><polygon points="120,12 228,128 12,128" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  }

  const img: ImageBlock = {
    tipo: 'imagen',
    url: svgImageDataUrl(svg),
    alt: kind,
    ancho: 'min(100%, 280px)',
    ajuste: 'contener',
  };
  return img;
}

export function ShapesPanel({ apiSlide, onCommitContent, disabled }: Props) {
  const addShape = (kind: ShapeKind) => {
    onCommitContent(appendBlockToSlideContent(apiSlide, shapeToBlock(kind)));
    toast.success('Forma añadida al slide');
  };

  return (
    <div className="space-y-3 border-b border-border pb-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Formas
      </p>
      <p className="px-1 text-[11px] leading-snug text-muted-foreground">
        Formas básicas como imagen vectorial; la línea usa el bloque separador.
      </p>
      <div className="grid grid-cols-2 gap-1.5 px-1">
        {ITEMS.map(({ kind, label, Icon }) => (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            onClick={() => addShape(kind)}
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
