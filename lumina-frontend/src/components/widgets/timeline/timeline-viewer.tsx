'use client';

import React, { useState } from 'react';
import type { TimelineWidget, TimelineNodo } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import chromeStyles from '@/components/widgets/shared/widget-chrome.module.css';
import { WidgetHeaderViewer } from '@/components/widgets/shared/widget-header-viewer';
import { useWidgetImageDimensions } from '@/components/widgets/shared/use-widget-image-dimensions';
import { imageElementStyle, usesComputedImageLayout } from '@/components/widgets/shared/widget-image-styles';

import styles from './timeline.module.css';
import { normalizeTimelineWidget } from './timeline-config';
import {
  TimelineContainerStyle,
  timelineBodyPadding,
  timelineHeaderPadding,
} from './timeline-shared';
import { TimelineNodeItem } from './timeline-parts';
import { TimelineStage } from './timeline-stage';

function TimelineViewerNode({
  nodo,
  index,
  config,
  isThumbnail,
  isActive,
  onActivate,
}: {
  nodo: TimelineNodo;
  index: number;
  config: TimelineWidget['configuracion'];
  isThumbnail?: boolean;
  isActive: boolean;
  onActivate: () => void;
}) {
  const {
    containerRef,
    imgRef,
    imgDims,
    getEffectiveContainerDims,
    handleImageLoad,
  } = useWidgetImageDimensions(nodo.imagen, { isThumbnail });

  const effectiveContainerDims = getEffectiveContainerDims();
  const computedImageLayout = usesComputedImageLayout(imgDims, effectiveContainerDims, { isThumbnail });
  const imageStyle = imageElementStyle(nodo, imgDims, effectiveContainerDims);

  return (
    <TimelineNodeItem
      nodo={nodo}
      index={index}
      config={config}
      isActive={isActive}
      isThumbnail={isThumbnail}
      interactive={!isThumbnail}
      imageStyle={imageStyle}
      computedImageLayout={computedImageLayout}
      containerRef={containerRef}
      imgRef={imgRef}
      onImageLoad={handleImageLoad}
      onNodeActivate={onActivate}
    />
  );
}

export function TimelineViewer({
  widget,
  isThumbnail = false,
}: {
  widget: TimelineWidget;
  isThumbnail?: boolean;
}) {
  const normalizedWidget = normalizeTimelineWidget(widget);
  const { configuracion, nodos } = normalizedWidget;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        chromeStyles.whRoot,
        isThumbnail && 'pointer-events-none overflow-hidden',
        styles.tlRoot,
      )}
      style={TimelineContainerStyle(configuracion)}
    >
      <div className={chromeStyles.whHeader} style={timelineHeaderPadding(configuracion)}>
        <WidgetHeaderViewer {...normalizedWidget} config={configuracion} />
      </div>

      <div className={chromeStyles.whContent} style={timelineBodyPadding(configuracion)}>
        <div className={styles.tlBody}>
          <TimelineStage
            config={configuracion}
            nodos={nodos}
            onBackgroundPointerDown={() => setActiveIndex(null)}
          >
            {nodos.map((nodo, idx) => (
              <TimelineViewerNode
                key={nodo.id}
                nodo={nodo}
                index={idx}
                config={configuracion}
                isThumbnail={isThumbnail}
                isActive={activeIndex === idx}
                onActivate={() => setActiveIndex((prev) => (prev === idx ? null : idx))}
              />
            ))}
          </TimelineStage>
        </div>
      </div>
    </div>
  );
}
