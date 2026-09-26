'use client';

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

import type { WidgetImagenAjuste } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';

import {
  applyImageElementStyle,
  computeImagePanClamp,
  containerPercentToPanPx,
  imageElementStyle,
  imageThumbnailStyle,
  imageWrapperStyle,
  panPxToContainerPercent,
  usesComputedImageLayout,
  type ImageWrapperCornerMode,
} from './widget-image-styles.js';
import { readContainerDimsFromRef, useWidgetImageDimensions } from './use-widget-image-dimensions.js';
import { stopWidgetInnerPointer } from './widget-editor-utils.js';

import slideStyles from './widget-slide-panel.module.css';
import chromeStyles from './widget-chrome.module.css';

export type WidgetFramedImageData = WidgetImagenAjuste & {
  imagen?: string;
  imagenAlt?: string;
};

export type WidgetFramedImageLayerProps = {
  data: WidgetFramedImageData;
  isSelected: boolean;
  isEditing: boolean;
  imageRadius?: number;
  /** `overlay` = capa absoluta (tabs/popup); `column` = columna split. */
  layout?: 'overlay' | 'column';
  imageCornerMode?: ImageWrapperCornerMode;
  isThumbnail?: boolean;
  imageFallbackBackground?: string;
  className?: string;
  /** Sustituye la clase base de columna/capa del slide-panel (p. ej. timeline). */
  layerClassName?: string;
  style?: CSSProperties;
  onSelect: () => void;
  onPatch: (patch: Partial<WidgetImagenAjuste>) => void;
  /** Controles sobre la imagen (p. ej. botón de cámara). */
  children?: ReactNode;
  /** Si no hay URL de imagen y `isEditing`, se muestra esto en lugar del placeholder por defecto. */
  emptySlot?: ReactNode;
};

/**
 * Imagen con encuadre cover + pan/zoom en el lienzo. Los offsets se persisten en %
 * del contenedor (mismo contrato que widget-slide-panel, clip-group e image-compare).
 */
export function WidgetFramedImageLayer({
  data,
  isSelected,
  isEditing,
  imageRadius = 0,
  layout = 'column',
  imageCornerMode = 'all',
  isThumbnail = false,
  imageFallbackBackground,
  className,
  layerClassName,
  style,
  onSelect,
  onPatch,
  children,
  emptySlot,
}: WidgetFramedImageLayerProps) {
  const fillOverlay = layout === 'overlay';
  const { containerRef, imgRef, imgDims, containerDims, getEffectiveContainerDims, handleImageLoad, measureContainer } =
    useWidgetImageDimensions(data.imagen, { isThumbnail });

  const effectiveContainerDims = getEffectiveContainerDims();
  const computedImageLayout = usesComputedImageLayout(imgDims, effectiveContainerDims, {
    isThumbnail,
  });

  useLayoutEffect(() => {
    if (!data.imagen || isThumbnail) return;
    measureContainer();
  }, [
    data.imagen,
    isThumbnail,
    measureContainer,
    imgDims.w,
    imgDims.h,
    data.imagenEscala,
    data.imagenOffsetX,
    data.imagenOffsetY,
  ]);

  const panRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
    pendingX: number;
    pendingY: number;
  } | null>(null);
  const resizeRef = useRef<{ startY: number; scale: number } | null>(null);

  const applyImagePosition = (offsetX: number, offsetY: number) => {
    const img = imgRef.current;
    if (!img) return;
    const liveDims = readContainerDimsFromRef(containerRef, containerDims);
    applyImageElementStyle(img, data, imgDims, liveDims, { offsetX, offsetY });
  };

  const finishPan = (el: HTMLElement, pointerId: number) => {
    if (panRef.current) {
      onPatch({
        imagenOffsetX: panPxToContainerPercent(panRef.current.pendingX, panRef.current.w),
        imagenOffsetY: panPxToContainerPercent(panRef.current.pendingY, panRef.current.h),
      });
    }
    panRef.current = null;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  const finishResize = (el: HTMLElement, pointerId: number) => {
    resizeRef.current = null;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  const layerClass =
    layerClassName ?? (fillOverlay ? slideStyles.wspImageLayer : slideStyles.wspImageCol);

  if (!data.imagen) {
    if (emptySlot) {
      return (
        <div
          className={cn(layerClass, className, isEditing && slideStyles.wspImageLayerInteractive)}
          style={style}
          onPointerDown={(e) => {
            if (!isEditing || isThumbnail) return;
            e.stopPropagation();
            onSelect();
          }}
        >
          {emptySlot}
        </div>
      );
    }
    return (
      <div
        className={cn(
          layerClass,
          slideStyles.wspImageColEmpty,
          isEditing && slideStyles.wspImageLayerInteractive,
          isSelected && chromeStyles.whInnerHighlight,
          className,
        )}
        style={style}
        onPointerDown={(e) => {
          if (!isEditing || isThumbnail) return;
          e.stopPropagation();
          onSelect();
        }}
        onClick={stopWidgetInnerPointer}
      >
        <div className={slideStyles.wspImagePlaceholder}>
          {isEditing ? '＋ Clic en Imagen (abajo) o aquí para seleccionar' : 'Sin imagen'}
        </div>
      </div>
    );
  }

  const imageWrapperStyles: CSSProperties = {
    ...imageWrapperStyle(data, imageRadius, imageCornerMode),
    backgroundColor: imageFallbackBackground ?? '#f1f5f9',
    ...style,
  };

  if (isThumbnail) {
    return (
      <div className={cn(layerClass, className)} style={imageWrapperStyles}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.imagen}
          alt={data.imagenAlt ?? ''}
          className={slideStyles.wspImageFit}
          style={imageThumbnailStyle(data)}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        layerClass,
        isEditing && slideStyles.wspImageLayerInteractive,
        isSelected && chromeStyles.whInnerHighlight,
        className,
      )}
      style={imageWrapperStyles}
      data-moveable-ignore={isEditing ? '' : undefined}
      onPointerDown={(e) => {
        if (!isEditing) return;
        e.stopPropagation();
        onSelect();
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        const w = Math.max(rect.width, 1);
        const h = Math.max(rect.height, 1);
        const ox = containerPercentToPanPx(data.imagenOffsetX ?? 0, w);
        const oy = containerPercentToPanPx(data.imagenOffsetY ?? 0, h);
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          ox,
          oy,
          w,
          h,
          pendingX: ox,
          pendingY: oy,
        };
      }}
      onPointerMove={(e) => {
        if (panRef.current) {
          const scale = (data.imagenEscala ?? 100) / 100;
          const { maxPanX, maxPanY } = computeImagePanClamp(
            imgDims.w,
            imgDims.h,
            panRef.current.w,
            panRef.current.h,
            scale,
          );
          const dx = e.clientX - panRef.current.startX;
          const dy = e.clientY - panRef.current.startY;
          const nextX = Math.max(-maxPanX, Math.min(maxPanX, panRef.current.ox + dx));
          const nextY = Math.max(-maxPanY, Math.min(maxPanY, panRef.current.oy + dy));
          panRef.current.pendingX = nextX;
          panRef.current.pendingY = nextY;
          applyImagePosition(nextX, nextY);
          return;
        }
        if (resizeRef.current) {
          const dy = resizeRef.current.startY - e.clientY;
          const next = Math.max(100, Math.min(200, resizeRef.current.scale + dy * 0.5));
          onPatch({ imagenEscala: Math.round(next) });
        }
      }}
      onPointerUp={(e) => {
        if (panRef.current) finishPan(e.currentTarget, e.pointerId);
        if (resizeRef.current) finishResize(e.currentTarget, e.pointerId);
      }}
      onPointerCancel={(e) => {
        if (panRef.current) finishPan(e.currentTarget, e.pointerId);
        if (resizeRef.current) finishResize(e.currentTarget, e.pointerId);
      }}
      onClick={(e) => {
        if (!isEditing) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={data.imagen}
        alt={data.imagenAlt ?? ''}
        className={cn(computedImageLayout ? slideStyles.wspImagePlaced : slideStyles.wspImageFit)}
        style={imageElementStyle(data, imgDims, effectiveContainerDims)}
        onLoad={handleImageLoad}
        draggable={false}
      />
      {children}
      {isEditing && isSelected ? (
        <span
          className={slideStyles.wspImageResizeHandle}
          title="Arrastra para cambiar el zoom"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            resizeRef.current = {
              startY: e.clientY,
              scale: Math.max(100, data.imagenEscala ?? 100),
            };
          }}
        />
      ) : null}
    </div>
  );
}
