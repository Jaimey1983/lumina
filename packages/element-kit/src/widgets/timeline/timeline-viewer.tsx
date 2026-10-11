'use client';

import React, { useState } from 'react';
import type { TimelineWidget, TimelineNodo } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';
import chromeStyles from '@lumina/editor-shared/widget-chrome.module.css';
import { WidgetHeaderViewer } from '@lumina/editor-shared/widget-header-viewer';
import { useWidgetImageDimensions } from '@lumina/editor-shared/use-widget-image-dimensions';
import { imageElementStyle, usesComputedImageLayout } from '@lumina/editor-shared/widget-image-styles';

import { WidgetMotionItem } from '../_motion/widget-motion.js';
import styles from './timeline.module.css';
import { entradaDeAnimacion, leerOpcionesT14, useEnVista } from './timeline-t14.js';
import { normalizeTimelineWidget } from './timeline-config.js';
import {
  TimelineContainerStyle,
  timelineBodyPadding,
  timelineHeaderPadding,
} from './timeline-shared.js';
import { TimelineNodeItem } from './timeline-parts.js';
import { TimelineStage } from './timeline-stage.js';

/** El envoltorio de movimiento ocupa el lugar del nodo en la fila (flex) sin cambiar el reparto. */
const ITEM_STYLE: React.CSSProperties = { flex: '1 1 0', minWidth: 0, minHeight: 0, display: 'flex' };

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
  const opciones = leerOpcionesT14(configuracion);
  const entrada = entradaDeAnimacion(opciones.animacion);
  const animar = entrada !== null && !isThumbnail;
  const [cuerpoRef, enVista] = useEnVista<HTMLDivElement>(animar);

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
        <div className={styles.tlBody} ref={cuerpoRef}>
          <TimelineStage
            config={configuracion}
            nodos={nodos}
            animar={animar && enVista}
            onBackgroundPointerDown={() => setActiveIndex(null)}
          >
            {/* T14: con animación, los nodos esperan a entrar en vista y aparecen uno tras otro. */}
            {animar && !enVista
              ? null
              : nodos.map((nodo, idx) => {
                  const nodoVista = (
                    <TimelineViewerNode
                      key={nodo.id}
                      nodo={nodo}
                      index={idx}
                      config={configuracion}
                      isThumbnail={isThumbnail}
                      isActive={activeIndex === idx}
                      onActivate={() => setActiveIndex((prev) => (prev === idx ? null : idx))}
                    />
                  );
                  return animar && entrada ? (
                    <WidgetMotionItem key={nodo.id} entrada={entrada} style={ITEM_STYLE}>
                      {nodoVista}
                    </WidgetMotionItem>
                  ) : (
                    nodoVista
                  );
                })}
          </TimelineStage>
        </div>
      </div>
    </div>
  );
}
