'use client';

import type { Block, Slide } from '@/types/slide.types';
import type { Animacion, TransicionSlide } from '@/types/animation.types';
import { AnimationList } from './animation-list';
import { TransitionPanel } from './transition-panel';

interface AnimationPanelProps {
  block: Block;
  /** Slide activo — para configurar la transición de entrada del slide */
  slide?: Slide | null;
  onUpdateAnimaciones: (animaciones: Animacion[]) => void;
  onUpdateTransicion?: (transicion: TransicionSlide) => void;
}

export function AnimationPanel({
  block,
  slide,
  onUpdateAnimaciones,
  onUpdateTransicion,
}: AnimationPanelProps) {
  return (
    <div className="flex flex-col gap-4 py-1">
      <AnimationList
        animaciones={block.animaciones ?? []}
        onUpdate={onUpdateAnimaciones}
      />
      {onUpdateTransicion && (
        <TransitionPanel
          transicion={slide?.transicion ?? null}
          onUpdate={onUpdateTransicion}
        />
      )}
    </div>
  );
}
