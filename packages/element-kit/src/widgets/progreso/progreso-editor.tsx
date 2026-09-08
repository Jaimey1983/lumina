'use client';

import type { ProgresoWidget } from '@lumina/types/widget';
import { useSlideNav } from '@lumina/editor-shared/slide-nav-context';
import { mergedProgresoConfig, resolveProgresoPercent } from './progreso-config.js';
import { ProgresoParts } from './progreso-parts.js';

interface ProgresoEditorProps {
  block: ProgresoWidget;
  onEnsureBlockSelected: () => void;
}

export function ProgresoEditor({ block, onEnsureBlockSelected }: ProgresoEditorProps) {
  const cfg = mergedProgresoConfig(block);
  const { slideIndex, slideCount } = useSlideNav();
  const percent = resolveProgresoPercent(cfg.porcentaje, cfg.modo, slideIndex, slideCount);
  const fractionLabel =
    cfg.modo === 'slides'
      ? slideCount > 0
        ? `${Math.min(slideIndex + 1, slideCount)} / ${slideCount}`
        : 'según diapositiva'
      : undefined;

  return (
    <div className="relative h-full w-full">
      <ProgresoParts
        block={block}
        percent={percent}
        fractionLabel={fractionLabel}
        isEditing
        onSelect={onEnsureBlockSelected}
      />
    </div>
  );
}
