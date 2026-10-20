"use client";

import { useState, type ReactElement } from "react";
import type { Escena } from "@lumina/drawing";
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, LockOpen, Pencil } from "lucide-react";
import { bloquearCapa, capasDe, ocultarCapa, ordenarCapa, renombrarCapa, type Capa } from "./propiedades.js";

const botonClase =
  "flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground outline-hidden hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30";

interface Props {
  escena: Escena;
  seleccion: readonly string[];
  onAplicar: (cambio: (e: Escena) => Escena) => void;
  onSeleccionar: (ids: string[], sumar: boolean) => void;
}

/** Lista de capas: lo que está al frente arriba. Elegir, subir, bajar, ocultar, bloquear y renombrar. */
export function PanelCapas({ escena, seleccion, onAplicar, onSeleccionar }: Props): ReactElement {
  const [renombrando, setRenombrando] = useState<{ id: string; valor: string } | null>(null);
  const capas = capasDe(escena);

  const terminar = (confirmar: boolean): void => {
    if (!renombrando) return;
    const { id, valor } = renombrando;
    setRenombrando(null);
    if (confirmar) onAplicar((e) => renombrarCapa(e, id, valor));
  };

  if (capas.length === 0) return <p className="text-xs text-muted-foreground">Todavía no hay nada en el dibujo.</p>;

  return (
    <ul aria-label="Capas del dibujo" className="space-y-0.5" data-capas="">
      {capas.map((c: Capa) => {
        const elegida = seleccion.includes(c.id);
        return (
          <li
            key={c.id}
            data-capa-id={c.id}
            aria-current={elegida ? "true" : undefined}
            className={`flex items-center gap-0.5 rounded px-1 ${elegida ? "bg-primary/10" : ""} ${c.oculto ? "opacity-50" : ""}`}
            style={{ paddingLeft: 4 + c.nivel * 14 }}
          >
            {renombrando?.id === c.id ? (
              <input
                type="text"
                autoFocus
                aria-label={`Nombre de ${c.nombre}`}
                className="h-6 min-w-0 flex-1 rounded border bg-background px-1 text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                value={renombrando.valor}
                maxLength={120}
                onChange={(e) => setRenombrando({ id: c.id, valor: e.target.value })}
                onBlur={() => terminar(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    terminar(true);
                  } else if (e.key === "Escape") {
                    e.stopPropagation();
                    terminar(false);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                aria-label={`Elegir ${c.nombre}`}
                aria-pressed={elegida}
                className="min-w-0 flex-1 truncate rounded py-1 text-left text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(e) => onSeleccionar([c.id], e.shiftKey)}
                onDoubleClick={() => setRenombrando({ id: c.id, valor: escena.elementos.find((x) => x.id === c.id)?.nombre ?? "" })}
              >
                {c.nombre}
              </button>
            )}
            <button
              type="button"
              className={botonClase}
              aria-label={`Renombrar ${c.nombre}`}
              title="Renombrar"
              onClick={() => setRenombrando({ id: c.id, valor: escena.elementos.find((x) => x.id === c.id)?.nombre ?? "" })}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className={botonClase}
              aria-label={`Subir ${c.nombre}`}
              title="Subir (más al frente)"
              disabled={!c.puedeSubir}
              onClick={() => onAplicar((e) => ordenarCapa(e, c.id, "subir"))}
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              className={botonClase}
              aria-label={`Bajar ${c.nombre}`}
              title="Bajar (más al fondo)"
              disabled={!c.puedeBajar}
              onClick={() => onAplicar((e) => ordenarCapa(e, c.id, "bajar"))}
            >
              <ArrowDown className="size-3.5" />
            </button>
            <button
              type="button"
              className={botonClase}
              aria-label={`${c.oculto ? "Mostrar" : "Ocultar"} ${c.nombre}`}
              aria-pressed={c.oculto}
              title={c.oculto ? "Mostrar" : "Ocultar"}
              onClick={() => onAplicar((e) => ocultarCapa(e, c.id, !c.oculto))}
            >
              {c.oculto ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
            <button
              type="button"
              className={botonClase}
              aria-label={`${c.bloqueado ? "Desbloquear" : "Bloquear"} ${c.nombre}`}
              aria-pressed={c.bloqueado}
              title={c.bloqueado ? "Desbloquear" : "Bloquear"}
              onClick={() => onAplicar((e) => bloquearCapa(e, c.id, !c.bloqueado))}
            >
              {c.bloqueado ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
