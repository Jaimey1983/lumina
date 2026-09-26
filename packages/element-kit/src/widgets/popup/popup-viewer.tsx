'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PopupWidget } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';

import styles from './popup.module.css';
import { mergedPopupConfig, normalizePopupWidget, popupChromeStyle } from './popup-config.js';
import { PopupModalPanel, PopupTriggerButton } from './popup-parts.js';
import { PopupSlidePortal } from './popup-portal.js';

export interface PopupViewerProps {
  block: PopupWidget;
}

export function PopupViewer({ block }: PopupViewerProps) {
  const [open, setOpen] = useState(false);
  const widget = normalizePopupWidget(block);
  const configuracion = mergedPopupConfig(block);

  useEffect(() => {
    if (configuracion.triggerEvento === 'auto') {
      setOpen(true);
    }
  }, [configuracion.triggerEvento]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const isHover = configuracion.triggerEvento === 'hover';
  const showModal = open;

  return (
    <div className={cn(styles.popupRoot)} style={popupChromeStyle(block)}>
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
