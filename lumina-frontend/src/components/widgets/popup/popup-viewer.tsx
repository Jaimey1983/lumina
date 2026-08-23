'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PopupWidget } from '@/types/widget.types';
import { cn } from '@/lib/utils';

import styles from './popup.module.css';
import { mergedPopupConfig, normalizePopupWidget, popupChromeStyle } from './popup-config';
import { PopupModalPanel, PopupTriggerButton } from './popup-parts';
import { PopupSlidePortal } from './popup-portal';

export interface PopupViewerProps {
  block: PopupWidget;
  isThumbnail?: boolean;
}

export function PopupViewer({ block, isThumbnail = false }: PopupViewerProps) {
  const [open, setOpen] = useState(false);
  const widget = normalizePopupWidget(block);
  const configuracion = mergedPopupConfig(block);

  useEffect(() => {
    if (isThumbnail) return;
    if (configuracion.triggerEvento === 'auto') {
      setOpen(true);
    }
  }, [configuracion.triggerEvento, isThumbnail]);

  const handleOpen = useCallback(() => {
    if (isThumbnail) return;
    setOpen(true);
  }, [isThumbnail]);

  const handleClose = useCallback(() => {
    if (isThumbnail) return;
    setOpen(false);
  }, [isThumbnail]);

  const isHover = configuracion.triggerEvento === 'hover' && !isThumbnail;
  const showModal = open && !isThumbnail;

  return (
    <div
      className={cn(styles.popupRoot, isThumbnail && 'pointer-events-none overflow-hidden')}
      style={popupChromeStyle(block)}
    >
      <div className={styles.popupStage}>
        {isHover ? (
          <div className={styles.popupHoverZone} onMouseLeave={handleClose}>
            <PopupTriggerButton
              configuracion={configuracion}
              expanded={showModal}
              onActivate={handleOpen}
              onMouseEnter={handleOpen}
            />
          </div>
        ) : (
          <PopupTriggerButton
            configuracion={configuracion}
            expanded={showModal}
            onActivate={handleOpen}
          />
        )}
      </div>

      {showModal ? (
        <PopupSlidePortal enabled>
          <PopupModalPanel
            overlay={widget.overlay}
            configuracion={configuracion}
            visible
            portaled
            onClose={handleClose}
          />
        </PopupSlidePortal>
      ) : null}
    </div>
  );
}
