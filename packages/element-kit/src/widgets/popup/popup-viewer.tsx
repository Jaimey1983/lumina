'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PopupWidget } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';

import { useAbrirOverlayPorId } from '../abrir-overlay.js';
import styles from './popup.module.css';
import { mergedPopupConfig, normalizePopupWidget, popupChromeStyle } from './popup-config.js';
import { PopupModalPanel, PopupTriggerButton } from './popup-parts.js';
import { PopupSlidePortal } from './popup-portal.js';

export interface PopupViewerProps {
  block: PopupWidget;
  isThumbnail?: boolean;
  /** Id del bloque: con él, el popup responde a «abrir overlay por id» (T15). */
  bloqueId?: string;
}

export function PopupViewer({ block, isThumbnail = false, bloqueId }: PopupViewerProps) {
  const [open, setOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
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

  // T15: otro widget (p. ej. un Botón) puede abrirlo o cerrarlo por id.
  useAbrirOverlayPorId(
    bloqueId,
    (accion) => setOpen((prev) => (accion === 'alternar' ? !prev : accion === 'abrir')),
    !isThumbnail,
  );

  const isHover = configuracion.triggerEvento === 'hover' && !isThumbnail;
  const showModal = open && !isThumbnail;

  return (
    <div
      className={cn(styles.popupRoot, isThumbnail && 'pointer-events-none overflow-hidden')}
      style={popupChromeStyle(block)}
    >
      <div ref={stageRef} className={styles.popupStage}>
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
            returnFocusTo={() => stageRef.current?.querySelector<HTMLElement>('button') ?? null}
          />
        </PopupSlidePortal>
      ) : null}
    </div>
  );
}
