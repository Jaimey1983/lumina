'use client';

import type { Block, Slide } from '@lumina/types/slide';
import type { Animacion, TransicionSlide } from '@lumina/types/animation';
import { WidgetPropertiesPanelBlock } from '@lumina/editor-shared/widget-properties-panel';
import { AnimationPanel } from '@/components/animations/animation-panel';

export type ApplyNow = (fn: (b: Block) => Block) => Promise<void>;

/** Cabecera común de los paneles de propiedades (mismo markup en todas las ramas). */
export function PropertiesHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
    </div>
  );
}

export interface PanelAnimacionesProps {
  block: Block;
  slide: Slide | null;
  applyAnimaciones: (animaciones: Animacion[]) => Promise<void>;
  applyTransicion: (transicion: TransicionSlide) => Promise<void>;
  onApplySlide?: (patch: Partial<Slide>) => Promise<boolean>;
}

/** Bloque «Animaciones» al pie del panel de un widget (se repetía 19 veces en las ramas). */
export function PanelAnimaciones({
  block,
  slide,
  applyAnimaciones,
  applyTransicion,
  onApplySlide,
}: PanelAnimacionesProps) {
  return (
    <WidgetPropertiesPanelBlock>
      <AnimationPanel
        block={block}
        slide={slide}
        onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
        onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
      />
    </WidgetPropertiesPanelBlock>
  );
}
