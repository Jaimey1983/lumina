"use client";

import type { ReactElement } from "react";
import { trazadoForma, type Escena, type Forma, type Punto } from "@lumina/drawing";
import { escenaAPantalla, type Vista } from "./vista.js";
import {
  ETIQUETA_ASA_HIJO,
  formaConAsasHijo,
  posicionesAsasHijo,
  RADIO_ASA_HIJO_PX,
  RADIO_ASA_HIJO_TACTIL_PX,
  type ContextoAsasHijo,
} from "./hijo-rapido.js";
import type { Herramienta } from "./herramientas.js";

const COLOR = "#16a34a";

/** Capa SVG de los cuatro «+» de hijo rápido. El clic lo resuelve `editor-libre` (hit-test puro). */
export function CapaAsasHijo({
  escena,
  vista,
  herramienta,
  seleccion,
  gestoEnCurso,
  edicionAbierta,
  tactil,
}: {
  escena: Escena;
  vista: Vista;
  herramienta: Herramienta;
  seleccion: readonly string[];
  gestoEnCurso: boolean;
  edicionAbierta: boolean;
  tactil: boolean;
}): ReactElement | null {
  const ctx: ContextoAsasHijo = { escena, herramienta, seleccion, gestoEnCurso, edicionAbierta };
  const formaId = formaConAsasHijo(ctx);
  if (!formaId) return null;
  const posiciones = posicionesAsasHijo(escena, formaId, vista.zoom);
  if (!posiciones) return null;
  const r = tactil ? RADIO_ASA_HIJO_TACTIL_PX : RADIO_ASA_HIJO_PX;
  return (
    <g data-capa="asas-hijo" pointerEvents="none">
      {posiciones.map((p) => {
        const s = escenaAPantalla(vista, p.centro);
        return (
          <g key={p.lado} data-asa-hijo={p.lado}>
            {/* Acceso por teclado: Y9 (`Ctrl+Enter`); el lienzo mantiene un solo foco (DW8). */}
            <circle cx={s.x} cy={s.y} r={r} fill="#fff" stroke={COLOR} strokeWidth={1.5} />
            <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={r * 1.1} fill={COLOR} fontWeight={600} pointerEvents="none">
              +
            </text>
            <title>{ETIQUETA_ASA_HIJO[p.lado]}</title>
            <circle cx={s.x} cy={s.y} r={r} fill="transparent" role="button" aria-label={ETIQUETA_ASA_HIJO[p.lado]} tabIndex={-1} />
          </g>
        );
      })}
    </g>
  );
}

/** Forma fantasma mientras se arrastra un «+» hacia un espacio vacío. */
export function CapaFantasmaHijo({
  escena,
  vista,
  padreId,
  centro,
}: {
  escena: Escena;
  vista: Vista;
  padreId: string;
  centro: Punto;
}): ReactElement | null {
  const padre = escena.elementos.find((e): e is Forma => e.id === padreId && e.tipo === "forma");
  if (!padre) return null;
  const t = padre.transformacion;
  const o = escenaAPantalla(vista, { x: centro.x - t.ancho / 2, y: centro.y - t.alto / 2 });
  const ancho = t.ancho * vista.zoom;
  const alto = t.alto * vista.zoom;
  return (
    <g data-capa="fantasma-hijo" pointerEvents="none">
      <path
        d={trazadoForma(padre.forma, ancho, alto, { parametros: padre.parametros, radio: padre.estilo.radio })}
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
