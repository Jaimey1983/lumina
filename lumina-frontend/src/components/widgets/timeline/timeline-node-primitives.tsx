'use client';

import React, { type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineConfiguracion, TimelineNodo } from '@/types/widget.types';
import { imageFilterStyle } from '@/components/widgets/shared/widget-image-styles';
import { getTimelineCardStyle } from './timeline-shared';
import {
  timelineCuerpoTextStyle,
  timelineEtiquetaTextStyle,
  timelineTituloTextStyle,
} from './timeline-text-styles';
import { TimelineLucideIcon } from './timeline-icon-catalog';
import {
  timelineImageInDot,
  timelineNodoTitulo,
  timelineUsesLucideDot,
  timelineUsesSegmentBar,
} from './timeline-variant-meta';

import styles from './timeline.module.css';
import slideStyles from '@/components/widgets/shared/widget-slide-panel.module.css';

export function TimelineCard({
  nodo,
  index = 0,
  config,
  isThumbnail,
  imageStyle,
  computedImageLayout,
  containerRef,
  imgRef,
  onImageLoad,
  etiquetaSlot,
  tituloSlot,
  imagenSlot,
  cuerpoSlot,
  usePlainContent,
}: {
  nodo: TimelineNodo;
  index?: number;
  config: TimelineConfiguracion;
  isThumbnail?: boolean;
  imageStyle?: CSSProperties;
  computedImageLayout?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  imgRef?: React.RefObject<HTMLImageElement | null>;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  etiquetaSlot?: React.ReactNode;
  tituloSlot?: React.ReactNode;
  imagenSlot?: React.ReactNode;
  cuerpoSlot?: React.ReactNode;
  usePlainContent?: boolean;
}) {
  const cardStyle = getTimelineCardStyle(config);
  const showImage =
    nodo.mostrarImagen && !timelineImageInDot(config.variante) && config.variante !== 'proyecto';
  const contentClass = usePlainContent ? styles.tlContentBlock : styles.tlCard;
  const yearOnBar = timelineUsesSegmentBar(config.variante);
  const showEtiquetaInCard = nodo.mostrarEtiqueta && !yearOnBar;
  const showTituloInCard = yearOnBar && (nodo.mostrarTituloNodo ?? true);

  const etiquetaBlock =
    etiquetaSlot ??
    (showEtiquetaInCard ? (
      <div className={styles.tlCardEtiqueta} style={timelineEtiquetaTextStyle(nodo, config)}>
        {nodo.etiqueta}
      </div>
    ) : null);

  const tituloBlock =
    tituloSlot ??
    (showTituloInCard ? (
      <div className={styles.tlCardTitulo} style={timelineTituloTextStyle(nodo, index, config)}>
        {timelineNodoTitulo(nodo)}
      </div>
    ) : null);

  const imagenBlock =
    imagenSlot ??
    (showImage ? (
      <div className={styles.tlCardImagen} ref={containerRef}>
        {nodo.imagen ? (
          <img
            ref={imgRef}
            src={nodo.imagen}
            alt=""
            className={slideStyles.wspImageFit}
            style={{ ...imageFilterStyle(nodo), ...imageStyle, position: 'absolute', inset: 0 }}
            onLoad={onImageLoad}
            draggable={false}
          />
        ) : (
          <div className={cn(slideStyles.wspImageFit, 'flex min-h-[60px] items-center justify-center bg-slate-100 text-slate-400')}>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>
    ) : null);

  const cuerpoBlock =
    cuerpoSlot ??
    (nodo.mostrarCuerpo ? (
      <div className={styles.tlCardCuerpo} style={timelineCuerpoTextStyle(nodo, config)}>
        {nodo.cuerpo}
      </div>
    ) : null);

  if (usePlainContent) {
    return (
      <div className={contentClass}>
        {showEtiquetaInCard && etiquetaBlock}
        {showTituloInCard && tituloBlock}
        {showImage && imagenBlock}
        {nodo.mostrarCuerpo && cuerpoBlock}
      </div>
    );
  }

  return (
    <div className={contentClass} style={cardStyle}>
      {showEtiquetaInCard && etiquetaBlock}
      {showTituloInCard && tituloBlock}
      {showImage && imagenBlock}
      {nodo.mostrarCuerpo && cuerpoBlock}
    </div>
  );
}

export function TimelineNodeDot({
  nodo,
  config,
  imageStyle,
  imgRef,
  onImageLoad,
}: {
  nodo: TimelineNodo;
  index: number;
  config: TimelineConfiguracion;
  isThumbnail?: boolean;
  imageStyle?: CSSProperties;
  computedImageLayout?: boolean;
  imgRef?: React.RefObject<HTMLImageElement | null>;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const showImageInDot = timelineImageInDot(config.variante) && nodo.mostrarImagen && !!nodo.imagen;
  const showLucide =
    timelineUsesLucideDot(config.variante) &&
    nodo.mostrarIconoLucide !== false &&
    nodo.iconoLucide !== 'none' &&
    !showImageInDot;

  return (
    <div className={styles.tlNodeDotWrap}>
      <span className={styles.tlNodeHalo} aria-hidden />
      <div className={styles.tlNodeDot}>
        {showImageInDot && (
          <img
            ref={imgRef}
            src={nodo.imagen}
            alt=""
            className={styles.tlNodeDotImg}
            style={{ ...imageFilterStyle(nodo), ...imageStyle }}
            onLoad={onImageLoad}
            draggable={false}
          />
        )}
        {showLucide && <TimelineLucideIcon name={nodo.iconoLucide} className="text-white" size={16} />}
      </div>
    </div>
  );
}

/** Conector vertical flexible entre tarjeta y nodo (reemplaza posicionamiento absoluto). */
export function TimelineConnectorFlex({ config }: { config: TimelineConfiguracion }) {
  if (!config.mostrarConectorVertical) return null;
  return <div className={styles.tlConnectorFlex} aria-hidden />;
}
