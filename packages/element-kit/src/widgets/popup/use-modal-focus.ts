'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** Elementos tabulables visibles dentro de `raiz`, en orden de documento. */
export function focusablesDe(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Foco de un diálogo modal mientras `activo` es `true`:
 *  - al abrir, recuerda quién tenía el foco y lo mueve dentro (al primer
 *    elemento tabulable o, si no hay, al propio diálogo);
 *  - Tab / Shift+Tab ciclan dentro del diálogo y no se escapan al slide;
 *  - al cerrar, devuelve el foco al disparador (`devolverA()` cuando el
 *    navegador no enfocó el botón al hacer clic, p. ej. Safari) .
 * Escape lo resuelve quien usa el hook (`useEscapeToClose`).
 */
export function useModalFocus(
  activo: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  devolverA?: () => HTMLElement | null,
): void {
  useEffect(() => {
    if (!activo) return;
    const dialogo = dialogRef.current;
    if (!dialogo) return;

    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const [primero] = focusablesDe(dialogo);
    (primero ?? dialogo).focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusablesDe(dialogo);
      if (items.length === 0) {
        e.preventDefault();
        dialogo.focus({ preventScroll: true });
        return;
      }
      const inicio = items[0];
      const fin = items[items.length - 1];
      const actual = document.activeElement;
      if (e.shiftKey && (actual === inicio || actual === dialogo || !dialogo.contains(actual))) {
        e.preventDefault();
        fin.focus();
      } else if (!e.shiftKey && (actual === fin || !dialogo.contains(actual))) {
        e.preventDefault();
        inicio.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const destino =
        previo && previo !== document.body && previo.isConnected ? previo : devolverA?.();
      destino?.focus({ preventScroll: true });
    };
    // `devolverA` es un callback estable por render del llamador; no debe reiniciar el trap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, dialogRef]);
}
