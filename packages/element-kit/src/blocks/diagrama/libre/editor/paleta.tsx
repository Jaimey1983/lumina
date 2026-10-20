"use client";

import type { ReactElement } from "react";
import { formasPorGrupo, trazadoForma, type TipoForma } from "@lumina/drawing";
import { Button } from "@lumina/ui/button";
import { ArrowRight, MousePointer2, Spline, Type } from "lucide-react";
import { esMismaHerramienta, type Herramienta } from "./herramientas.js";

export interface PaletaProps {
  herramienta: Herramienta;
  onElegir: (h: Herramienta) => void;
}

const HERRAMIENTAS: Array<{ h: Herramienta; nombre: string; atajo: string; icono: ReactElement }> = [
  { h: { tipo: "seleccionar" }, nombre: "Seleccionar", atajo: "V", icono: <MousePointer2 /> },
  { h: { tipo: "linea", flecha: false }, nombre: "Línea", atajo: "L", icono: <Spline /> },
  { h: { tipo: "linea", flecha: true }, nombre: "Flecha", atajo: "A", icono: <ArrowRight /> },
  { h: { tipo: "texto" }, nombre: "Texto", atajo: "T", icono: <Type /> },
];

const ANCHO_MINIATURA = 30;
const ALTO_MINIATURA = 22;

function Miniatura({ forma }: { forma: TipoForma }): ReactElement {
  return (
    <svg width={ANCHO_MINIATURA} height={ALTO_MINIATURA} viewBox={`-2 -2 ${ANCHO_MINIATURA + 4} ${ALTO_MINIATURA + 4}`} aria-hidden="true" className="overflow-visible">
      <path d={trazadoForma(forma, ANCHO_MINIATURA, ALTO_MINIATURA)} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

/** Paleta lateral: las herramientas y el catálogo de formas agrupado (básicas, flechas, diagramas). */
export function Paleta({ herramienta, onElegir }: PaletaProps): ReactElement {
  return (
    <aside aria-label="Paleta de formas y herramientas" data-dibujo-paleta="" className="flex w-52 shrink-0 flex-col gap-3 overflow-y-auto border-r bg-card p-2">
      <div className="space-y-1">
        <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Herramientas</div>
        <div className="grid grid-cols-4 gap-1">
          {HERRAMIENTAS.map(({ h, nombre, atajo, icono }) => {
            const activa = esMismaHerramienta(herramienta, h);
            return (
              <Button
                key={nombre}
                type="button"
                variant={activa ? "secondary" : "ghost"}
                size="icon"
                className="size-9"
                title={`${nombre} (${atajo})`}
                aria-label={nombre}
                aria-pressed={activa}
                onClick={() => onElegir(h)}
              >
                {icono}
              </Button>
            );
          })}
        </div>
      </div>

      {formasPorGrupo().map(({ grupo, nombre, formas }) => (
        <section key={grupo} aria-label={nombre} className="space-y-1">
          <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{nombre}</div>
          <div className="grid grid-cols-4 gap-1">
            {formas.map((f) => {
              const activa = herramienta.tipo === "forma" && herramienta.forma === f.id;
              return (
                <Button
                  key={f.id}
                  type="button"
                  variant={activa ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-full"
                  title={f.nombre}
                  aria-label={`Insertar ${f.nombre}`}
                  aria-pressed={activa}
                  data-forma={f.id}
                  onClick={() => onElegir({ tipo: "forma", forma: f.id })}
                >
                  <Miniatura forma={f.id} />
                </Button>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}
