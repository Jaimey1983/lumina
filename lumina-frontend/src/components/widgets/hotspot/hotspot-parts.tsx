import { useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  HotspotInnerSelection,
  HotspotWidget,
  WidgetSlideContent,
  WidgetSlideTextField,
} from '@/types/widget.types';
import { mergedHotspotConfig } from './hotspot-config';
import styles from './hotspot.module.css';
import { WidgetSlidePanelEditor, WidgetSlidePanelView } from '@/components/widgets/shared/widget-slide-panel';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import { toHotspotSlidePanelConfig } from './hotspot-config';
import {
  HOTSPOT_OVERLAY_GAP_PX,
  overlayShiftVars,
} from '@/components/widgets/shared/overlay-auto-position';
import { useOverlayAutoPosition } from '@/components/widgets/shared/use-overlay-auto-position';

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
    >
      <div ref={markerRef} className={styles.markerWrapper} onClick={handleClick}>
        <div className={styles.markerDot} />
        {!isEditing && <div className={styles.markerPulse} />}
      </div>

      <div
        ref={bubbleRef}
        className={cn(
          styles.bubbleContainer,
          posClass,
          effectClass,
          showBubble ? styles.bubbleVisible : styles.bubbleHidden,
          isEditing && styles.bubbleEditing,
        )}
        style={overlayShiftVars(overlay.shiftX, overlay.shiftY)}
        onClick={(e) => {
          stopWidgetInnerPointer(e);
        }}
      >
        {!isEditing ? (
          <div className={styles.bubbleHeader}>
            {cfg.mostrarBotonCerrar ? (
              <button className={styles.closeButton} onClick={onClose}>
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
