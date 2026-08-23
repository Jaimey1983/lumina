'use client';

import { useRef } from 'react';

import type { PopupInnerSelection, PopupWidget, WidgetSlideContent } from '@/types/widget.types';

import { cn } from '@/lib/utils';
import styles from './popup.module.css';
import {
  isEditingPopupOverlay,
  mergedPopupConfig,
  normalizePopupWidget,
  popupChromeStyle,
} from './popup-config';
import { PopupModalPanel, PopupTriggerButton } from './popup-parts';
import { PopupSlidePortal } from './popup-portal';
export interface PopupEditorProps {
  block: PopupWidget;
  onChange: (block: PopupWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: PopupInnerSelection | null;
  onInnerSelectionChange?: (selection: PopupInnerSelection | null) => void;
}

export function PopupEditor({
  block,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: PopupEditorProps) {
  const widget = normalizePopupWidget(block);
  const configuracion = mergedPopupConfig(block);
  const editingOverlay = isEditingPopupOverlay(innerSelection);
  const suppressBackdropUntilRef = useRef(0);

  const ensureSelected = () => onEnsureBlockSelected?.();

  const patchWidget = (fn: (w: PopupWidget) => PopupWidget) => {
    onChange(fn(normalizePopupWidget(block)));
  };

  const patchOverlay = (patch: Partial<WidgetSlideContent>) => {
    patchWidget((w) => ({
      ...w,
      overlay: { ...w.overlay, ...patch },
    }));
  };

  const patchConfig = (patch: Partial<typeof configuracion>) => {
    patchWidget((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  return (
    <div
      className={cn(styles.popupRoot, styles.popupRootEditor)}
      style={popupChromeStyle(block)}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-widget-slide-panel]')) return;
        if (target.closest(`.${styles.popupModal}`)) return;
        if (target.closest(`.${styles.popupTrigger}`)) return;
        onInnerSelectionChange?.({ kind: 'widget' });
      }}
    >
      <div className={styles.popupStage}>
        <PopupTriggerButton
          configuracion={configuracion}
          selected={innerSelection?.kind === 'trigger'}
          editable
          onSelect={() => {
            ensureSelected();
            onInnerSelectionChange?.({ kind: 'trigger' });
          }}
        />
      </div>

      {editingOverlay ? (
        <PopupSlidePortal enabled>
          <PopupModalPanel
            overlay={widget.overlay}
            configuracion={configuracion}
            visible
            isEditing
            portaled
            editable
            innerSelection={innerSelection}
            onPatchOverlay={patchOverlay}
            onSelectOverlay={() => {
              ensureSelected();
              onInnerSelectionChange?.({ kind: 'overlay' });
            }}
            onSelectText={(field) => {
              ensureSelected();
              onInnerSelectionChange?.({ kind: 'overlay-text', field });
            }}
            onSelectImage={() => {
              ensureSelected();
              onInnerSelectionChange?.({ kind: 'overlay-image' });
            }}
            onExitEdit={() => {
              if (performance.now() < suppressBackdropUntilRef.current) return;
              onInnerSelectionChange?.({ kind: 'widget' });
            }}
            onPatchConfig={patchConfig}
          />
        </PopupSlidePortal>
      ) : null}
    </div>
  );
}
