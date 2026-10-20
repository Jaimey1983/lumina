"use client";

import type { MouseEvent } from "react";
import { DibujoEditor as WidgetEditor, DibujoProperties as WidgetProperties, DibujoViewer as WidgetViewer } from "../../widgets/dibujo/index.js";
import type { ElementEditorProps, ElementPropsPanelProps, ElementViewerProps } from "@lumina/element-kit-core";
import { ListaAccesible } from "./accesibilidad.js";
import type { DibujoConfig, DibujoEstado } from "./dibujo-types.js";

export function DibujoEditor({ estado, config, onChange }: ElementEditorProps<DibujoEstado, DibujoConfig>) {
  return <WidgetEditor estado={estado} onChange={onChange} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

/** Id del elemento del dibujo bajo `objetivo` (los elementos se dibujan como `<g data-elemento-id>`). */
export function elementoBajo(objetivo: EventTarget | null): string | null {
  const nodo = objetivo as Element | null;
  return nodo?.closest?.("[data-elemento-id]")?.getAttribute("data-elemento-id") ?? null;
}

/**
 * Vista de solo lectura. Con motor (`config.emitir`), fuera de miniaturas: un clic emite `clic` y, si cae sobre un
 * elemento, `parte_clic` con `{ parte: id }`; la lista accesible hace lo mismo para teclado y lector de pantalla.
 */
export function DibujoViewer({ estado, config }: ElementViewerProps<DibujoEstado, DibujoConfig>) {
  const miniatura = config.isThumbnail === true;
  const emitir = miniatura ? undefined : config.emitir;
  const alClic = emitir
    ? (e: MouseEvent<HTMLDivElement>): void => {
        emitir("clic");
        const id = elementoBajo(e.target);
        if (id) emitir("parte_clic", { parte: id });
      }
    : undefined;
  const alElegir = emitir
    ? (id: string): void => {
        emitir("clic");
        emitir("parte_clic", { parte: id });
      }
    : undefined;
  return (
    <div className={`relative h-full w-full${emitir ? " [&_[data-elemento-id]]:cursor-pointer" : ""}`} data-dibujo-interactivo={emitir ? "" : undefined} onClick={alClic}>
      <WidgetViewer estado={estado} isThumbnail={miniatura} />
      {miniatura ? null : <ListaAccesible escena={estado.escena} {...(alElegir ? { onElegir: alElegir } : {})} />}
    </div>
  );
}

export function DibujoPropiedades({ estado, onChange }: ElementPropsPanelProps<DibujoEstado, DibujoConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
