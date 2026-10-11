import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@lumina/ui/lib/utils';
import type {
  HotspotInnerSelection,
  HotspotWidget,
  WidgetSlideContent,
  WidgetSlideTextField,
} from '@lumina/types/widget';
import { mergedHotspotConfig } from './hotspot-config.js';
import styles from './hotspot.module.css';
import { WidgetSlidePanelEditor, WidgetSlidePanelView } from '@lumina/editor-shared/widget-slide-panel';
import { stopWidgetInnerPointer } from '@lumina/editor-shared/widget-editor-utils';
import { toHotspotSlidePanelConfig } from './hotspot-config.js';
import {
  HOTSPOT_OVERLAY_GAP_PX,
  overlayShiftVars,
} from '@lumina/editor-shared/overlay-auto-position';
import { useOverlayAutoPosition } from '@lumina/editor-shared/use-overlay-auto-position';

interface HotspotPartsProps {
  block: HotspotWidget;
  isOpen: boolean;
  isEditing?: boolean;
  innerSelection?: HotspotInnerSelection | null;
  onToggle?: () => void;
  onClose?: () => void;
  onEditOverlay?: () => void;
  onPatchOverlay?: (patch: Partial<WidgetSlideContent>) => void;
  onSelectText?: (field: WidgetSlideTextField) => void;
  onSelectImage?: () => void;
}

export function HotspotParts({
  block,
  isOpen,
  isEditing = false,
  innerSelection,
  onToggle,
  onClose,
  onEditOverlay,
  onPatchOverlay,
  onSelectText,
  onSelectImage,
}: HotspotPartsProps) {
  const cfg = mergedHotspotConfig(block);
  const markerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const showBubble = isOpen || isEditing;
  const overlay = useOverlayAutoPosition({
    active: showBubble,
    configuredSide: cfg.posicionBurbuja,
    triggerRef: markerRef,
    bubbleRef,
    gap: HOTSPOT_OVERLAY_GAP_PX,
    fallbackSize: { width: cfg.anchoBurbuja, height: 160 },
    layoutKey: `${block.x}-${block.y}-${cfg.anchoBurbuja}`,
  });
  const posBurbuja = cfg.posicionBurbuja === 'auto' ? overlay.side : cfg.posicionBurbuja;

  let posClass = styles.posBottom;
  if (posBurbuja === 'arriba') posClass = styles.posTop;
  if (posBurbuja === 'izquierda') posClass = styles.posLeft;
  if (posBurbuja === 'derecha') posClass = styles.posRight;

  let effectClass = '';
  if (cfg.efectoApertura === 'fade') effectClass = styles.effectFade;
  else if (cfg.efectoApertura === 'slide-up') effectClass = styles.effectSlideUp;
  else effectClass = styles.effectInstant;

  let sizeClass = styles.sizeMedium;
  if (cfg.tamanoPunto === 'pequeno') sizeClass = styles.sizeSmall;
  if (cfg.tamanoPunto === 'grande') sizeClass = styles.sizeLarge;

  const mappedSelection =
    innerSelection?.kind === 'overlay-text'
      ? { kind: 'slide-text' as const, slideId: block.overlay.id, field: innerSelection.field }
      : innerSelection?.kind === 'overlay-image'
        ? { kind: 'slide-image' as const, slideId: block.overlay.id }
        : null;

  // Teclado y foco (T15): el marcador es un botón; Escape cierra y devuelve el foco al marcador;
  // al abrir con clic/teclado el foco pasa a la burbuja (con `hover` no se roba el foco).
  const abiertaPorClic = !isEditing && cfg.triggerEvento === 'click';
  const abiertaAntes = useRef(false);
  useEffect(() => {
    if (!abiertaPorClic) return;
    if (isOpen && !abiertaAntes.current) {
      bubbleRef.current?.focus({ preventScroll: true });
    } else if (!isOpen && abiertaAntes.current) {
      const burbuja = bubbleRef.current;
      if (burbuja && burbuja.contains(document.activeElement)) markerRef.current?.focus();
    }
    abiertaAntes.current = isOpen;
  }, [isOpen, abiertaPorClic]);

  const handleMarkerKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;
    if ((e.key === 'Enter' || e.key === ' ') && onToggle) {
      e.preventDefault();
      onToggle();
    }
  };

  const handleRootKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen && !isEditing && onClose) {
      e.stopPropagation();
      onClose();
      markerRef.current?.focus();
    }
  };

  const handlePointerEnter = () => {
    if (cfg.triggerEvento === 'hover' && !isEditing && onToggle && !isOpen) {
      onToggle();
    }
  };

  const handlePointerLeave = () => {
    if (cfg.triggerEvento === 'hover' && !isEditing && onClose && isOpen) {
      onClose();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (cfg.triggerEvento === 'click' && onToggle && !isEditing) {
      stopWidgetInnerPointer(e);
      onToggle();
    } else if (isEditing && onEditOverlay) {
      stopWidgetInnerPointer(e);
      onEditOverlay();
    }
  };

  return (
    <div
      className={cn(styles.hotspotRoot, sizeClass)}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleRootKeyDown}
    >
      <div
        ref={markerRef}
        className={styles.markerWrapper}
        onClick={handleClick}
        onKeyDown={handleMarkerKeyDown}
        role={isEditing ? undefined : 'button'}
        tabIndex={isEditing ? undefined : 0}
        aria-expanded={isEditing ? undefined : isOpen}
        aria-haspopup={isEditing ? undefined : 'dialog'}
        aria-label={isEditing ? undefined : 'Mostrar información'}
      >
        <div className={styles.markerDot} />
        {!isEditing && <div className={styles.markerPulse} />}
      </div>

      <div
        ref={bubbleRef}
        role={isEditing ? undefined : 'dialog'}
        aria-label={isEditing ? undefined : 'Información'}
        tabIndex={isEditing ? undefined : -1}
        className={cn(
          styles.bubbleContainer,
          posClass,
          effectClass,
          showBubble ? styles.bubbleVisible : styles.bubbleHidden,
          isEditing && styles.bubbleEditing,
        )}
        style={overlayShiftVars(overlay.shiftX, overlay.shiftY, overlay.arrowShift)}
        onClick={(e) => {
          stopWidgetInnerPointer(e);
        }}
      >
        {!isEditing ? (
          <div className={styles.bubbleHeader}>
            {cfg.mostrarBotonCerrar ? (
              <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
                <X size={16} />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className={cn(styles.bubbleBody, isEditing && styles.bubbleBodyEditing)}>
          {isEditing ? (
            <div className={styles.bubblePanelEditor}>
              <WidgetSlidePanelEditor
                slide={block.overlay}
                configuracion={toHotspotSlidePanelConfig(cfg, block.overlay)}
                innerSelection={mappedSelection}
                onPatchSlide={onPatchOverlay ?? (() => {})}
                onSelectText={(field) => onSelectText?.(field)}
                onSelectImage={() => onSelectImage?.()}
              />
            </div>
          ) : (
            <WidgetSlidePanelView
              slide={block.overlay}
              configuracion={toHotspotSlidePanelConfig(cfg, block.overlay)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
