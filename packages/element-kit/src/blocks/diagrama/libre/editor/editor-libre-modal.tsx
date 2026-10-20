"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";

export interface EditorLibreModalProps {
  abierto: boolean;
  escena: Escena;
  titulo?: string;
  onCambio: (escena: Escena) => void;
  onCerrar: (escena: Escena) => void;
}

/**
 * Abre el editor a pantalla casi completa (DW6) encima de todo, fuera del lienzo del slide:
 * el slide aplica transformaciones y recortes que romperían el arrastre. Al cerrar devuelve el foco
 * a quien lo tenía antes.
 */
export function EditorLibreModal({ abierto, escena, titulo, onCambio, onCerrar }: EditorLibreModalProps): ReactElement | null {
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return undefined;
    // El lienzo se abre sin enfocarse (`enfocarAlAbrir={false}`): aquí todavía se sabe qué tenía el foco.
    previo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.querySelector<SVGSVGElement>("[data-dibujo-editor] [role=application]")?.focus();
    return () => {
      previo.current?.focus?.();
    };
  }, [abierto]);

  if (!abierto || typeof document === "undefined") return null;
  return createPortal(<EditorLibre escena={escena} enfocarAlAbrir={false} {...(titulo !== undefined ? { titulo } : {})} onCambio={onCambio} onCerrar={onCerrar} />, document.body);
}
