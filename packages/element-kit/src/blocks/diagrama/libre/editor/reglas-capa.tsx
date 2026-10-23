"use client";

// Reglas y guías del usuario (Y16a): las dos reglas (a un lado del lienzo, sin tapar nada) y la capa de guías sobre el dibujo.

import type { PointerEvent, ReactElement } from "react";
import { marcasDeRegla, textoDeMarca, type GuiaUsuario, type OrientacionGuia } from "./reglas.js";
import type { Vista } from "./vista.js";

/** Grosor de cada regla, en píxeles. */
export const GROSOR_REGLA = 20;
const COLOR_GUIA = "#db2777";

export interface ReglaEjeProps {
  /** `x`: la regla de arriba (crea guías verticales); `y`: la de la izquierda (crea guías horizontales). */
  eje: "x" | "y";
  vista: Vista;
  /** Largo de la regla en píxeles (el ancho o el alto del lienzo). */
  longitud: number;
  guias: readonly GuiaUsuario[];
  /** Se apretó la regla en un sitio libre: empieza una guía nueva. */
  onNuevaGuia: (orientacion: OrientacionGuia, e: PointerEvent<SVGElement>) => void;
  /** Se apretó el marcador de una guía: se mueve (o se quita llevándola de vuelta a la regla). */
  onMoverGuia: (guia: GuiaUsuario, e: PointerEvent<SVGElement>) => void;
  /** Doble clic en el marcador: se quita. */
  onQuitarGuia: (guia: GuiaUsuario) => void;
}

export function ReglaEje({ eje, vista, longitud, guias, onNuevaGuia, onMoverGuia, onQuitarGuia }: ReglaEjeProps): ReactElement {
  const horizontal = eje === "x";
  const desplazamiento = horizontal ? vista.x : vista.y;
  const marcas = marcasDeRegla(vista.zoom, (0 - desplazamiento) / vista.zoom, (longitud - desplazamiento) / vista.zoom);
  const orientacion: OrientacionGuia = horizontal ? "vertical" : "horizontal";
  const aPx = (valor: number): number => valor * vista.zoom + desplazamiento;
  return (
    <svg
      aria-hidden="true"
      data-regla={eje}
      className="shrink-0 select-none bg-muted text-muted-foreground"
      style={horizontal ? { height: GROSOR_REGLA, flex: "1 1 0%", minWidth: 0 } : { width: GROSOR_REGLA, height: "100%" }}
      width={horizontal ? "100%" : GROSOR_REGLA}
      height={horizontal ? GROSOR_REGLA : "100%"}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        onNuevaGuia(orientacion, e);
      }}
    >
      <line x1={horizontal ? 0 : GROSOR_REGLA - 0.5} y1={horizontal ? GROSOR_REGLA - 0.5 : 0} x2={horizontal ? "100%" : GROSOR_REGLA - 0.5} y2={horizontal ? GROSOR_REGLA - 0.5 : "100%"} stroke="currentColor" strokeOpacity={0.4} />
      {marcas.map((m) => {
        const px = aPx(m.valor);
        const largo = m.mayor ? 12 : 5;
        return (
          <g key={m.valor}>
            {horizontal ? (
              <line x1={px} y1={GROSOR_REGLA - largo} x2={px} y2={GROSOR_REGLA} stroke="currentColor" strokeOpacity={m.mayor ? 0.8 : 0.45} />
            ) : (
              <line x1={GROSOR_REGLA - largo} y1={px} x2={GROSOR_REGLA} y2={px} stroke="currentColor" strokeOpacity={m.mayor ? 0.8 : 0.45} />
            )}
            {m.mayor ? (
              <text
                data-marca=""
                fill="currentColor"
                fontSize={9}
                x={horizontal ? px + 2 : 8}
                y={horizontal ? 9 : px - 2}
                {...(horizontal ? {} : { transform: `rotate(-90 8 ${px - 2})` })}
              >
                {textoDeMarca(m.valor)}
              </text>
            ) : null}
          </g>
        );
      })}
      {guias
        .filter((g) => g.orientacion === orientacion)
        .map((g) => {
          const px = aPx(g.posicion);
          const puntas = horizontal ? `${px - 5},${GROSOR_REGLA} ${px + 5},${GROSOR_REGLA} ${px},${GROSOR_REGLA - 8}` : `${GROSOR_REGLA},${px - 5} ${GROSOR_REGLA},${px + 5} ${GROSOR_REGLA - 8},${px}`;
          return (
            <polygon
              key={g.id}
              data-guia-marca={g.id}
              points={puntas}
              fill={COLOR_GUIA}
              style={{ cursor: horizontal ? "col-resize" : "row-resize" }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                e.preventDefault();
                onMoverGuia(g, e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onQuitarGuia(g);
              }}
            />
          );
        })}
    </svg>
  );
}

export interface CapaGuiasUsuarioProps {
  guias: readonly GuiaUsuario[];
  vista: Vista;
  /** La guía que se está llevando de vuelta a la regla: se ve atenuada (al soltar se quita). */
  quitando?: number | null;
  /** La guía nueva que se arrastra desde una regla (aún no existe). */
  previa?: { orientacion: OrientacionGuia; posicion: number } | null;
}

const lineaGuia = (key: string, orientacion: OrientacionGuia, posicion: number, vista: Vista, atenuada: boolean, id?: number): ReactElement => {
  const px = orientacion === "vertical" ? posicion * vista.zoom + vista.x : posicion * vista.zoom + vista.y;
  return orientacion === "vertical" ? (
    <line key={key} data-guia={id ?? "previa"} x1={px} y1={0} x2={px} y2="100%" stroke={COLOR_GUIA} strokeWidth={1} strokeDasharray="6 3" opacity={atenuada ? 0.3 : 0.9} />
  ) : (
    <line key={key} data-guia={id ?? "previa"} x1={0} y1={px} x2="100%" y2={px} stroke={COLOR_GUIA} strokeWidth={1} strokeDasharray="6 3" opacity={atenuada ? 0.3 : 0.9} />
  );
};

/** Las guías, de lado a lado del lienzo. No reciben clics: el editor las detecta por cercanía (y siempre después de los elementos). */
export function CapaGuiasUsuario({ guias, vista, quitando = null, previa = null }: CapaGuiasUsuarioProps): ReactElement {
  return (
    <g data-capa="guias-usuario" pointerEvents="none">
      {guias.map((g) => lineaGuia(`g${g.id}`, g.orientacion, g.posicion, vista, g.id === quitando, g.id))}
      {previa ? lineaGuia("previa", previa.orientacion, previa.posicion, vista, false) : null}
    </g>
  );
}
