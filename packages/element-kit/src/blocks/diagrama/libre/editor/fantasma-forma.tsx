"use client";

import type { ReactElement } from "react";
import { trazadoForma, type Punto, type TipoForma } from "@lumina/drawing";
import { cajaPorDefecto } from "./herramientas.js";
import { escenaAPantalla, type Vista } from "./vista.js";

const COLOR = "#2563eb";

/** Forma fantasma (tamaño por defecto) bajo el cursor mientras se arrastra desde la galería de formas (Y11). */
export function CapaFantasmaForma({ vista, forma, centro }: { vista: Vista; forma: TipoForma; centro: Punto }): ReactElement {
  const caja = cajaPorDefecto(forma, centro);
  const o = escenaAPantalla(vista, { x: caja.x, y: caja.y });
  const ancho = caja.ancho * vista.zoom;
  const alto = caja.alto * vista.zoom;
  return (
    <g data-capa="fantasma-forma" data-forma={forma} pointerEvents="none">
      <path
        d={trazadoForma(forma, ancho, alto)}
        transform={`translate(${o.x} ${o.y})`}
        fill={COLOR}
        fillOpacity={0.08}
        stroke={COLOR}
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
    </g>
  );
}
