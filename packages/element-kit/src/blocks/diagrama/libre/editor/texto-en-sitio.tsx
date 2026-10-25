"use client";

import { useEffect, useRef, type CSSProperties, type KeyboardEvent as TeclaReact, type ReactElement } from "react";
import { componerTexto } from "@lumina/drawing";
import type { AreaDeTexto } from "./herramientas.js";
import { escenaAPantalla, type Vista } from "./vista.js";

export interface TextoEnSitioProps {
  area: AreaDeTexto;
  valor: string;
  vista: Vista;
  onCambio: (valor: string) => void;
  /** Enter (sin Mayús; con lista, Ctrl/Cmd+Enter) o perder el foco. */
  onConfirmar: () => void;
  /** Escape. */
  onCancelar: () => void;
}

const ALINEACION_V = { arriba: "flex-start", medio: "center", abajo: "flex-end" } as const;

/**
 * Cuadro de texto que se pone justo encima del elemento que se está escribiendo (misma zona, giro,
 * tamaño de letra y alineación, ya con el zoom aplicado). Enter confirma, Mayús+Enter salta de línea,
 * Escape cancela. En un elemento con lista (viñetas o números) Enter salta de línea —cada línea es un
 * ítem— y se confirma con Ctrl/Cmd+Enter, con un clic fuera o perdiendo el foco.
 */
export function TextoEnSitio({ area, valor, vista, onCambio, onConfirmar, onCancelar }: TextoEnSitioProps): ReactElement {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const origen = escenaAPantalla(vista, { x: area.caja.x, y: area.caja.y });
  const centro = escenaAPantalla(vista, area.centro);

  // Al abrir: foco y todo el texto elegido; al escribir: el cuadro crece con el contenido.
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [valor, vista.zoom]);

  // Con lista (Y24a) el texto va a la izquierda y deja a la izquierda el sitio de las marcas (que se ven al confirmar, no al escribir).
  const sangria = area.vinetas ? componerTexto(valor, area.caja.ancho, area.tamano, area.negrita, area.vinetas).sangria : 0;

  const estilo: CSSProperties = {
    position: "absolute",
    left: origen.x,
    top: origen.y,
    width: area.caja.ancho * vista.zoom,
    height: area.caja.alto * vista.zoom,
    transform: area.rotacion === 0 ? undefined : `rotate(${area.rotacion}deg)`,
    transformOrigin: `${centro.x - origen.x}px ${centro.y - origen.y}px`,
    display: "flex",
    alignItems: ALINEACION_V[area.alineacionV],
  };

  const alTeclear = (e: TeclaReact<HTMLTextAreaElement>): void => {
    // Lo que se escribe aquí no es de nadie más: ni atajos del editor ni del editor de diapositivas.
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onCancelar();
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Con lista, Enter es «ítem nuevo» (el salto de línea lo hace el cuadro); confirmar pide Ctrl/Cmd.
      if (area.vinetas && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      onConfirmar();
    }
  };

  return (
    <div style={estilo} data-dibujo-texto-en-sitio="" onPointerDown={(e) => e.stopPropagation()}>
      <textarea
        ref={ref}
        value={valor}
        aria-label="Texto del elemento"
        title={area.vinetas ? "Enter: ítem nuevo · Ctrl+Enter o clic fuera: terminar" : "Enter: terminar · Mayús+Enter: línea nueva"}
        rows={1}
        spellCheck={false}
        onChange={(e) => onCambio(e.target.value)}
        onKeyDown={alTeclear}
        onBlur={onConfirmar}
        className="w-full resize-none overflow-hidden rounded-sm border-0 bg-background/90 p-0 outline-2 outline-offset-1 outline-primary"
        style={{
          fontSize: area.tamano * vista.zoom,
          fontWeight: area.negrita ? 700 : 400,
          fontStyle: area.cursiva ? "italic" : "normal",
          textAlign: area.vinetas || area.alineacionH === "izquierda" ? "left" : area.alineacionH === "derecha" ? "right" : "center",
          paddingLeft: sangria > 0 ? sangria * vista.zoom : undefined,
          color: area.color,
          lineHeight: 1.25,
        }}
      />
    </div>
  );
}
