"use client";

// ─── Barra de estado del editor (Y4) ──────────────────────────────────────────
// Qué hay y qué está elegido (cantidad, posición y tamaño de la selección), dónde está el cursor en la
// escena, el zoom (deslizador), los interruptores de cuadrícula e imán, la ayuda de la herramienta y un
// lugar reservado para el indicador de guardado (lo llena la fase E). Las coordenadas del cursor las lleva
// la propia barra en su estado: así mover el puntero no vuelve a pintar todo el editor.

import { useEffect, useState, type MutableRefObject, type ReactElement, type ReactNode } from "react";
import type { Punto } from "@lumina/drawing";
import type { Marco } from "./asas.js";
import { comando, textoDeAtajo } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import { ZOOM_MAX, ZOOM_MIN } from "./vista.js";

// ─── Formato (puro) ───────────────────────────────────────────────────────────

const entero = (n: number): number => Math.round(n) + 0; // `+ 0` evita «-0»

/** «X 100 · Y 50» — la posición del cursor en la escena. */
export const textoCursor = (p: Punto): string => `X ${entero(p.x)} · Y ${entero(p.y)}`;

/** «X 100 · Y 50 · 200 × 100 · 30°» — posición, tamaño y, si está girada, el ángulo de la selección. */
export function textoGeometria(m: Pick<Marco, "x" | "y" | "ancho" | "alto" | "rotacion">): string {
  const partes = [`X ${entero(m.x)}`, `Y ${entero(m.y)}`, `${entero(m.ancho)} × ${entero(m.alto)}`];
  const giro = entero(((m.rotacion % 360) + 360) % 360);
  if (giro !== 0 && giro !== 360) partes.push(`${giro}°`);
  return partes.join(" · ");
}

export const textoZoom = (zoom: number): string => `${Math.round(zoom * 100)}%`;

// El deslizador va en escala logarítmica: de 10 % a 800 % hay un factor de 80 y, en lineal, todo lo útil
// (50 %–200 %) quedaría apretado en un par de milímetros.
const LN_MIN = Math.log(ZOOM_MIN);
const LN_MAX = Math.log(ZOOM_MAX);
export const posicionDeZoom = (zoom: number): number => Math.min(1, Math.max(0, (Math.log(zoom) - LN_MIN) / (LN_MAX - LN_MIN)));
export const zoomDePosicion = (pos: number): number => Math.exp(LN_MIN + Math.min(1, Math.max(0, pos)) * (LN_MAX - LN_MIN));

// ─── Componente ───────────────────────────────────────────────────────────────

export interface BarraEstadoProps {
  cantidad: number;
  seleccionados: number;
  /** Marco de la selección (posición, tamaño y giro), o `null` si no hay nada elegido. */
  marco: Pick<Marco, "x" | "y" | "ancho" | "alto" | "rotacion"> | null;
  zoom: number;
  cuadricula: boolean;
  imantar: boolean;
  /** Ayuda de la herramienta activa. */
  ayuda: string;
  /** Un interruptor o el zoom piden una orden (la misma que un botón de la cinta). */
  onOrden: (orden: Orden) => void;
  /** Pone el zoom en un valor (0,1–8) manteniendo el centro de la vista. */
  onZoom: (zoom: number) => void;
  /** El editor llama a lo que se deje acá con la posición del cursor en la escena (o `null` al salir). */
  cursorRef: MutableRefObject<((p: Punto | null) => void) | null>;
  /** Indicador de guardado (fase E). Hoy no se muestra nada, pero el sitio está reservado. */
  guardado?: ReactNode;
}

function Interruptor({ id, activo, onOrden }: { id: "cuadricula" | "imantar"; activo: boolean; onOrden: (o: Orden) => void }): ReactElement {
  const def = comando(id);
  const Icono = def.icono;
  return (
    // `role="switch"` y no «button»: el mismo comando ya es un botón en la cinta (Vista) y no deben confundirse.
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={def.etiqueta}
      title={textoDeAtajo(def) ? `${def.etiqueta} (${textoDeAtajo(def)})` : def.etiqueta}
      data-estado-interruptor={id}
      className={`flex h-5 cursor-pointer items-center gap-1 rounded px-1.5 outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3 ${activo ? "bg-accent text-accent-foreground" : ""}`}
      onClick={() => onOrden(def.orden)}
    >
      {Icono ? <Icono aria-hidden="true" /> : null}
      {id === "cuadricula" ? "Cuadrícula" : "Imán"}
    </button>
  );
}

export function BarraEstado({ cantidad, seleccionados, marco, zoom, cuadricula, imantar, ayuda, onOrden, onZoom, cursorRef, guardado }: BarraEstadoProps): ReactElement {
  const [cursor, setCursor] = useState<Punto | null>(null);

  useEffect(() => {
    cursorRef.current = setCursor;
    return () => {
      cursorRef.current = null;
    };
  }, [cursorRef]);

  const hay = seleccionados > 0;
  return (
    <div className="flex items-center gap-3 border-t bg-card px-3 py-1 text-[11px] text-muted-foreground" data-barra-estado="">
      <span data-dibujo-estado="" className="shrink-0">
        {cantidad === 0 ? "Lienzo vacío" : `${cantidad} ${cantidad === 1 ? "elemento" : "elementos"}`}
        {hay ? ` · ${seleccionados} ${seleccionados === 1 ? "seleccionado" : "seleccionados"}` : ""}
      </span>
      {hay && marco ? (
        <span data-estado-geometria="" className="shrink-0 tabular-nums" title="Posición y tamaño de la selección (y giro, si lo tiene)">
          {textoGeometria(marco)}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate" title={ayuda}>
        {ayuda}
      </span>
      <span data-dibujo-guardado="" className="shrink-0">
        {guardado}
      </span>
      <span data-estado-cursor="" aria-hidden="true" className="min-w-24 shrink-0 text-right tabular-nums">
        {cursor ? textoCursor(cursor) : ""}
      </span>
      <div role="group" aria-label="Ayudas de dibujo" className="flex shrink-0 items-center gap-1">
        <Interruptor id="cuadricula" activo={cuadricula} onOrden={onOrden} />
        <Interruptor id="imantar" activo={imantar} onOrden={onOrden} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          type="range"
          aria-label="Zoom"
          aria-valuetext={textoZoom(zoom)}
          data-estado-zoom-control=""
          className="h-1 w-28 cursor-pointer accent-primary"
          min={0}
          max={1}
          step={0.005}
          value={posicionDeZoom(zoom)}
          onChange={(e) => onZoom(zoomDePosicion(Number(e.target.value)))}
        />
        <span data-estado-zoom="" className="w-9 text-right tabular-nums">
          {textoZoom(zoom)}
        </span>
      </div>
    </div>
  );
}
