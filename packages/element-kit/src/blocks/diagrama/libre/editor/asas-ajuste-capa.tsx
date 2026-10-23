"use client";

import type { ReactElement } from "react";
import type { Forma } from "@lumina/drawing";
import { asasAjusteEnPantalla, TAMANO_ASA_AJUSTE_PX, TAMANO_ASA_AJUSTE_TACTIL_PX } from "./asas-ajuste.js";
import type { Vista } from "./vista.js";

const RELLENO = "#FACC15";
const BORDE = "#854d0e";

/** Capa SVG de los rombos amarillos de ajuste de la forma elegida. El clic lo resuelve `editor-libre` (prueba de impacto pura). */
export function CapaAsasAjuste({ forma, vista, tactil }: { forma: Forma | null; vista: Vista; tactil: boolean }): ReactElement | null {
  if (!forma) return null;
  const asas = asasAjusteEnPantalla(forma, vista);
  if (asas.length === 0) return null;
  const r = (tactil ? TAMANO_ASA_AJUSTE_TACTIL_PX : TAMANO_ASA_AJUSTE_PX) / 2;
  return (
    <g data-capa="asas-ajuste" pointerEvents="none">
      {asas.map((a) => (
        <polygon
          key={a.clave}
          data-asa-ajuste={a.clave}
          data-etiqueta={a.etiqueta}
          points={`${a.centro.x},${a.centro.y - r} ${a.centro.x + r},${a.centro.y} ${a.centro.x},${a.centro.y + r} ${a.centro.x - r},${a.centro.y}`}
          fill={RELLENO}
          stroke={BORDE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}
