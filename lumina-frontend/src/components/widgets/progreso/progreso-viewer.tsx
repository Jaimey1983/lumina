'use client';

import type { ProgresoWidget } from '@/types/widget.types';
import { useSlideNav } from '@/components/widgets/shared/slide-nav-context';
import { mergedProgresoConfig, resolveProgresoPercent } from './progreso-config';
import { ProgresoParts } from './progreso-parts';

interface ProgresoViewerProps {
  block: ProgresoWidget;
  isThumbnail?: boolean;
}

export function ProgresoViewer({ block, isThumbnail = false }: ProgresoViewerProps) {
  const cfg = mergedProgresoConfig(block);
  const { slideIndex, slideCount } = useSlideNav();
  const percent = resolveProgresoPercent(cfg.porcentaje, cfg.modo, slideIndex, slideCount);
  const fractionLabel =
    cfg.modo === 'slides' && slideCount > 0
      ? `${Math.min(slideIndex + 1, slideCount)} / ${slideCount}`
      : undefined;

  return (
    <div className="relative h-full w-full">
      <ProgresoParts
        block={block}
        percent={isThumbnail && cfg.modo === 'slides' ? 45 : percent}
        fractionLabel={isThumbnail ? undefined : fractionLabel}
      />
    </div>
  );
}
