// Foco atrapado y retorno al cerrar un diálogo del editor (Y5).

import { useCallback, useEffect, useRef, type RefObject } from "react";

// Los elementos con `tabindex="-1"` (las opciones de un combobox) se alcanzan con las flechas, no con Tab: no cuentan.
const SELECTOR_ENFOCABLE = [
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function enfoqueables(contenedor: HTMLElement): HTMLElement[] {
  return [...contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE)].filter(
    (el) => el.getAttribute("aria-disabled") !== "true" && !el.hasAttribute("disabled"),
  );
}

export interface OpcionesFocoAtrapado {
  abierto: boolean;
  contenedorRef: RefObject<HTMLElement | null>;
  /** Escape o un clic fuera piden cerrar; el diálogo decide (normalmente pone `abierto` en `false`). */
  alCerrar: () => void;
  /** Adónde va el foco si el elemento que lo tenía antes de abrir ya no está en el documento. */
  focoRespaldo?: () => void;
}

export interface FocoAtrapado {
  /**
   * Evita que al cerrarse el foco vuelva al elemento anterior: para cuando el diálogo mismo lleva el foco a
   * otro sitio (p. ej. al lienzo tras ejecutar un comando). Sin esto, el retorno iría después y lo pisaría.
   */
  soltarSinRetorno: () => void;
}

/**
 * Guarda el foco al abrir, lo lleva al primer elemento, atrapa Tab, retiene las teclas del diálogo (no llegan al
 * editor ni a `window`), cierra con Escape o con un clic fuera y, al cerrar, devuelve el foco a donde estaba.
 * Los callbacks se leen por referencia: pasarlos como funciones nuevas en cada render no reinicia el efecto.
 */
export function useFocoAtrapado({ abierto, contenedorRef, alCerrar, focoRespaldo }: OpcionesFocoAtrapado): FocoAtrapado {
  const anterior = useRef<Element | null>(null);
  const omitirRetorno = useRef(false);
  const vivo = useRef({ alCerrar, focoRespaldo });
  vivo.current = { alCerrar, focoRespaldo };

  const soltarSinRetorno = useCallback((): void => {
    omitirRetorno.current = true;
  }, []);

  useEffect(() => {
    if (!abierto) return;
    omitirRetorno.current = false;
    anterior.current = document.activeElement;
    const contenedor = contenedorRef.current;
    if (contenedor) enfoqueables(contenedor)[0]?.focus();

    const alTecla = (e: KeyboardEvent): void => {
      // Nada de lo que se teclea en el diálogo llega al editor de diapositivas ni al resto del editor.
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        vivo.current.alCerrar();
        return;
      }
      if (e.key !== "Tab" || !contenedor) return;
      const lista = enfoqueables(contenedor);
      if (lista.length === 0) return;
      e.preventDefault();
      const actual = document.activeElement as HTMLElement | null;
      const i = actual ? lista.indexOf(actual) : -1;
      const siguiente = e.shiftKey ? (i <= 0 ? lista.length - 1 : i - 1) : i === lista.length - 1 ? 0 : i + 1;
      lista[siguiente]?.focus();
    };

    // En captura: el editor detiene los clics (`stopPropagation` en su raíz) y en burbuja no llegarían al documento.
    const alClicFuera = (e: MouseEvent): void => {
      if (contenedor && !contenedor.contains(e.target as Node)) vivo.current.alCerrar();
    };

    contenedor?.addEventListener("keydown", alTecla);
    document.addEventListener("click", alClicFuera, true);
    return () => {
      contenedor?.removeEventListener("keydown", alTecla);
      document.removeEventListener("click", alClicFuera, true);
      if (omitirRetorno.current) return;
      const prev = anterior.current;
      if (prev instanceof HTMLElement && prev.isConnected) prev.focus();
      else vivo.current.focoRespaldo?.();
    };
  }, [abierto, contenedorRef]);

  return { soltarSinRetorno };
}
