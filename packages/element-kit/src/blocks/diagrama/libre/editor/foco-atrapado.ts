// Foco atrapado y retorno al cerrar un diálogo del editor (Y5).

import { useEffect, useRef, type RefObject } from "react";

const SELECTOR_ENFOCABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function enfoqueables(contenedor: HTMLElement): HTMLElement[] {
  return [...contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE)].filter(
    (el) => el.getAttribute("aria-disabled") !== "true" && !el.hasAttribute("disabled"),
  );
}

export interface OpcionesFocoAtrapado {
  abierto: boolean;
  contenedorRef: RefObject<HTMLElement | null>;
  alCerrar: () => void;
  /** Si el elemento anterior ya no está en el documento. */
  focoRespaldo?: () => void;
  /** Tecla Escape: si devuelve true, no se llama alCerrar (p. ej. ya manejado). */
  alEscape?: (e: KeyboardEvent) => boolean;
}

/** Guarda el foco al abrir, atrapa Tab y devuelve el foco al cerrar. */
export function useFocoAtrapado({ abierto, contenedorRef, alCerrar, focoRespaldo, alEscape }: OpcionesFocoAtrapado): void {
  const anterior = useRef<Element | null>(null);

  useEffect(() => {
    if (!abierto) return;
    anterior.current = document.activeElement;
    const contenedor = contenedorRef.current;
    const primero = contenedor ? enfoqueables(contenedor)[0] : undefined;
    primero?.focus();

    const alTab = (e: KeyboardEvent): void => {
      if (e.key !== "Tab" || !contenedor) return;
      const lista = enfoqueables(contenedor);
      if (lista.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const actual = document.activeElement as HTMLElement | null;
      const i = actual ? lista.indexOf(actual) : -1;
      const siguiente = e.shiftKey ? (i <= 0 ? lista.length - 1 : i - 1) : i === lista.length - 1 ? 0 : i + 1;
      lista[siguiente]?.focus();
    };

    const alTecla = (e: KeyboardEvent): void => {
      e.stopPropagation();
      if (e.key === "Escape") {
        if (alEscape?.(e)) return;
        e.preventDefault();
        alCerrar();
      }
    };

    const alClicFuera = (e: MouseEvent): void => {
      if (contenedor && !contenedor.contains(e.target as Node)) alCerrar();
    };

    contenedor?.addEventListener("keydown", alTecla);
    contenedor?.addEventListener("keydown", alTab);
    document.addEventListener("mousedown", alClicFuera);
    return () => {
      contenedor?.removeEventListener("keydown", alTecla);
      contenedor?.removeEventListener("keydown", alTab);
      document.removeEventListener("mousedown", alClicFuera);
      const prev = anterior.current;
      if (prev instanceof HTMLElement && prev.isConnected) prev.focus();
      else focoRespaldo?.();
    };
  }, [abierto, alCerrar, alEscape, contenedorRef, focoRespaldo]);
}
