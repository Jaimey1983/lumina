'use client';

import { createPortal } from 'react-dom';

import { useSlideCanvasRoot } from '@/components/widgets/shared/slide-canvas-root-context';

import styles from './popup.module.css';

export interface PopupSlidePortalProps {
  children: React.ReactNode;
  enabled: boolean;
}

/** Renderiza backdrop/modal dentro del slide root, no dentro del bloque del trigger. */
export function PopupSlidePortal({ children, enabled }: PopupSlidePortalProps) {
  const slideRoot = useSlideCanvasRoot();

  if (!enabled || !slideRoot || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={styles.popupPortalLayer}
      data-popup-overlay-portal
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    slideRoot,
  );
}
