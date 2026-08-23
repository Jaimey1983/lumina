'use client';

import { Circle, Minus, Square, Triangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block, FormaBlock } from '@/types/slide.types';
import { appendBlockToSlideContent } from '@/lib/class-slide-normalize';
import { cn } from '@/lib/utils';

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
  const shapeMap: Record<ShapeKind, FormaBlock['forma']> = {
    rect: 'rectangulo',
    circle: 'circulo',
    triangle: 'triangulo',
    line: 'linea',
  };

  const forma: FormaBlock = {
    tipo: 'forma',
    id: crypto.randomUUID(),
    forma: shapeMap[kind],
    color: '#94a3b8',
  };

  if (kind === 'line') {
    forma.color = '#64748b';
    forma.grosorBorde = 2;
  } else {
    forma.colorBorde = '#475569';
    forma.grosorBorde = 4;
    forma.ancho = kind === 'circle' ? 140 : 240;
    if (kind !== 'circle') {
      forma.alto = 140;
    } else {
      forma.alto = 140;
    }
  }

  return forma;
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
