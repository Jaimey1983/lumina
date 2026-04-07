'use client';

import { AlignCenter, AlignLeft, AlignRight, Bold, Type } from 'lucide-react';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { getSlideContentRecord } from '@/lib/class-slide-normalize';
import type { Block, TextAlign } from '@/types/slide.types';
import { cn } from '@/lib/utils';

import {
  applyTextTypography,
  getLastTextBlock,
  type TextTypographyPatch,
} from './slide-block-helpers';

const SIZES: { id: string; label: string; tamanoFuente: string }[] = [
  { id: 'sm', label: 'SM', tamanoFuente: '0.875rem' },
  { id: 'md', label: 'MD', tamanoFuente: '1rem' },
  { id: 'lg', label: 'LG', tamanoFuente: '1.25rem' },
  { id: 'xl', label: 'XL', tamanoFuente: '1.5rem' },
];

const WEIGHTS: { id: string; label: string; negrita: boolean }[] = [
  { id: 'normal', label: 'Normal', negrita: false },
  { id: 'bold', label: 'Negrita', negrita: true },
];

const ALIGNS: {
  id: string;
  label: string;
  alineacion: TextAlign;
  Icon: typeof AlignLeft;
}[] = [
  { id: 'left', label: 'Izq.', alineacion: 'izquierda', Icon: AlignLeft },
  { id: 'center', label: 'Centro', alineacion: 'centro', Icon: AlignCenter },
  { id: 'right', label: 'Der.', alineacion: 'derecha', Icon: AlignRight },
];

interface Props {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function TextFormatPanel({ apiSlide, onCommitContent, disabled }: Props) {
  const c = getSlideContentRecord(apiSlide);
  const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
  const lastText = getLastTextBlock(bloques);

  const commit = (patch: TextTypographyPatch) => {
    onCommitContent(applyTextTypography(apiSlide, patch));
  };

  return (
    <div className="space-y-3 border-b border-border pb-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Texto
      </p>
      <p className="px-1 text-[11px] leading-snug text-muted-foreground">
        Cada opción actualiza el último bloque de texto del slide, o crea uno si no existe.
      </p>

      <div className="space-y-1.5">
        <span className="px-1 text-[10px] font-medium text-muted-foreground">Tamaño</span>
        <div className="grid grid-cols-4 gap-1">
          {SIZES.map(({ id, label, tamanoFuente }) => {
            const active = lastText?.tamanoFuente === tamanoFuente;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => commit({ tamanoFuente })}
                className={cn(
                  'rounded-md border px-1 py-1.5 text-center text-[11px] font-medium transition-colors',
                  disabled && 'cursor-not-allowed opacity-40',
                  !disabled && active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="px-1 text-[10px] font-medium text-muted-foreground">Peso</span>
        <div className="grid grid-cols-2 gap-1">
          {WEIGHTS.map(({ id, label, negrita }) => {
            const active = negrita ? !!lastText?.negrita : !lastText?.negrita;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => commit({ negrita })}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs transition-colors',
                  disabled && 'cursor-not-allowed opacity-40',
                  !disabled && active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {negrita ? <Bold className="size-3.5 shrink-0" /> : <Type className="size-3.5 shrink-0" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="px-1 text-[10px] font-medium text-muted-foreground">Alineación</span>
        <div className="grid grid-cols-3 gap-1">
          {ALIGNS.map(({ id, label, alineacion, Icon }) => {
            const active = (lastText?.alineacion ?? 'izquierda') === alineacion;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => commit({ alineacion })}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-md border px-1 py-2 text-[10px] transition-colors',
                  disabled && 'cursor-not-allowed opacity-40',
                  !disabled && active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
