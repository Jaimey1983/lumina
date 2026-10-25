"use client";

import { useRef, type ReactElement } from "react";
import { fijarPagina, fueraDePagina, type CambioDePagina, type Escena } from "@lumina/drawing";
import { CollapsibleSection } from "@lumina/ui/collapsible-section";
import { CampoNumero, Conmutador, Fila, FilaColor } from "./propiedades-campos.js";
import { ID_PERSONALIZADO, LIMITE_ALTO, LIMITE_ANCHO, TAMANOS_DE_PAGINA, tamanoDe, textoFuera } from "./pagina-ajustes.js";

/** El color de fondo que se pone al quitar y volver a poner el fondo, si nunca hubo uno (sigue al tema, DY12). */
const FONDO_POR_DEFECTO = "var(--background)";

export interface SeccionPaginaProps {
  escena: Escena;
  /** Cambia el tamaño o el fondo: una entrada de historial (y, si cambió el tamaño, ajusta la vista). */
  onPagina: (cambio: CambioDePagina) => void;
  /** Vista previa del fondo mientras se arrastra el selector libre: no entra al historial hasta `onFinVista`. */
  onVista: (cambio: (e: Escena) => Escena) => void;
  onFinVista: () => void;
  onSeleccionar: (ids: string[], sumar: boolean) => void;
}

/** Los ajustes de la página del dibujo (Y25): tamaño, ancho y alto, fondo, y el aviso de lo que queda fuera. Se ve cuando no hay nada elegido. */
export function SeccionPagina({ escena, onPagina, onVista, onFinVista, onSeleccionar }: SeccionPaginaProps): ReactElement {
  const ultimoFondo = useRef<string>(FONDO_POR_DEFECTO);
  if (escena.fondo !== null) ultimoFondo.current = escena.fondo;
  const fuera = fueraDePagina(escena);
  const tamano = tamanoDe(escena);

  return (
    <div className="divide-y px-3" data-pagina-ajustes="">
      <CollapsibleSection title="Página" storageKey="dibujo-pagina" defaultOpen>
        <div className="space-y-2 pb-2 pt-1">
          <Fila etiqueta="Tamaño">
            <select
              aria-label="Tamaño de la página"
              className="h-7 min-w-0 rounded-md border bg-background px-1.5 text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              value={tamano}
              onChange={(e) => {
                const t = TAMANOS_DE_PAGINA.find((x) => x.id === e.target.value);
                if (t) onPagina({ ancho: t.ancho, alto: t.alto });
              }}
            >
              {TAMANOS_DE_PAGINA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.etiqueta} ({t.ancho} × {t.alto})
                </option>
              ))}
              {tamano === ID_PERSONALIZADO ? <option value={ID_PERSONALIZADO}>Personalizado</option> : null}
            </select>
          </Fila>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Ancho
              <CampoNumero etiqueta="Ancho de la página" valor={{ mixto: false, valor: escena.ancho }} min={LIMITE_ANCHO.min} max={LIMITE_ANCHO.max} unidad="px" onConfirmar={(n) => onPagina({ ancho: n })} />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Alto
              <CampoNumero etiqueta="Alto de la página" valor={{ mixto: false, valor: escena.alto }} min={LIMITE_ALTO.min} max={LIMITE_ALTO.max} unidad="px" onConfirmar={(n) => onPagina({ alto: n })} />
            </label>
          </div>
          <Fila etiqueta="Sin fondo">
            <Conmutador
              etiqueta="Página sin fondo (transparente)"
              valor={{ mixto: false, valor: escena.fondo === null }}
              icono={<span className="text-xs">{escena.fondo === null ? "Sí" : "No"}</span>}
              onCambiar={(sin) => onPagina({ fondo: sin ? null : ultimoFondo.current })}
            />
          </Fila>
          {escena.fondo !== null ? (
            <FilaColor
              etiqueta="Fondo"
              etiquetaColor="Color de fondo de la página"
              valor={{ mixto: false, valor: escena.fondo }}
              onElegir={(c) => onPagina({ fondo: c })}
              onVista={(c) => onVista((e) => fijarPagina(e, { fondo: c }))}
              onFin={onFinVista}
            />
          ) : null}
          {fuera.length > 0 ? (
            <div role="status" data-pagina-fuera="" className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
              <p>{textoFuera(fuera.length)}.</p>
              <button
                type="button"
                className="rounded-md border bg-background px-2 py-1 text-xs outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSeleccionar(fuera, false)}
              >
                Elegirlos
              </button>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}
