"use client";

import type { ReactElement } from "react";
import { cajaDeElemento, type Escena } from "@lumina/drawing";
import { capasDe } from "./editor/propiedades.js";

export interface ElementoAccesible {
  id: string;
  /** Lo que oye un lector de pantalla: la descripción que escribió el docente; si no hay, el nombre o uno que describe el elemento. */
  etiqueta: string;
  /** `true` si la etiqueta es la descripción escrita por el docente (y no una inventada). */
  conDescripcion: boolean;
}

/** Dos elementos están «en la misma fila» si sus centros verticales distan menos que esto (unidades de escena). */
const TOLERANCIA_FILA = 30;

/**
 * Los elementos visibles de la escena en orden de lectura: por filas de arriba abajo y, dentro de cada fila, de izquierda a
 * derecha. La fila se decide por el centro vertical (una forma más alta que su vecina sigue en la misma fila).
 * Los grupos no se listan (no se ven) y lo oculto tampoco.
 */
export function elementosAccesibles(escena: Escena): ElementoAccesible[] {
  const capas = new Map(capasDe(escena).map((c) => [c.id, c]));
  const lista = escena.elementos.flatMap((e) => {
    const capa = capas.get(e.id);
    if (e.tipo === "grupo" || !capa || capa.oculto) return [];
    const descripcion = e.descripcion?.trim();
    const caja = cajaDeElemento(escena, e);
    return [{ id: e.id, etiqueta: descripcion || capa.nombre, conDescripcion: Boolean(descripcion), centro: (caja?.y ?? 0) + (caja?.alto ?? 0) / 2, x: caja?.x ?? 0 }];
  });
  const porAltura = [...lista].sort((a, b) => a.centro - b.centro);
  const filas: (typeof lista)[] = [];
  for (const item of porAltura) {
    const fila = filas[filas.length - 1];
    if (fila && item.centro - (fila[0]?.centro ?? 0) < TOLERANCIA_FILA) fila.push(item);
    else filas.push([item]);
  }
  return filas.flatMap((fila) => fila.sort((a, b) => a.x - b.x)).map(({ id, etiqueta, conDescripcion }) => ({ id, etiqueta, conDescripcion }));
}

/**
 * Lista de los elementos para lectores de pantalla (el `<svg>` es una imagen y su interior no se lee).
 * Con `onElegir` cada elemento es un botón: es la vía del teclado y del lector para activarlo, igual que el clic.
 * Está fuera de la vista y solo aparece (arriba a la izquierda) mientras el foco está dentro.
 */
export function ListaAccesible({ escena, onElegir }: { escena: Escena; onElegir?: (id: string) => void }): ReactElement | null {
  const elementos = elementosAccesibles(escena);
  if (elementos.length === 0) return null;
  return (
    <ul
      aria-label="Elementos del dibujo"
      data-dibujo-lista-accesible=""
      className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-2 focus-within:top-2 focus-within:z-10 focus-within:max-h-40 focus-within:overflow-y-auto focus-within:rounded-md focus-within:border focus-within:bg-background focus-within:p-1 focus-within:text-xs focus-within:shadow-md"
    >
      {elementos.map((e) => (
        <li key={e.id} data-elemento-lista={e.id}>
          {onElegir ? (
            <button
              type="button"
              className="w-full rounded px-2 py-1 text-left outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(ev) => {
                // El clic del contenedor emitiría un segundo `clic`: el botón ya avisa por sí solo.
                ev.stopPropagation();
                onElegir(e.id);
              }}
            >
              {e.etiqueta}
            </button>
          ) : (
            e.etiqueta
          )}
        </li>
      ))}
    </ul>
  );
}
