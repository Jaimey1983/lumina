"use client";

// Medidas en vivo (Y16b): la etiqueta junto al cursor (X · Y, ancho × alto o ángulo) y las cotas del espaciado y de las distancias.

import type { ReactElement } from "react";
import type { Cota } from "@lumina/drawing";
import type { Vista } from "./vista.js";

const COLOR_COTA = "#0891b2";
const COLOR_IGUAL = "#db2777";

export interface MedidaEnVivo {
  texto: string;
  /** Posición del puntero en píxeles de pantalla (la etiqueta va un poco más abajo y a la derecha). */
  x: number;
  y: number;
}

export interface MedidasCapaProps {
  vista: Vista;
  medida: MedidaEnVivo | null;
  cotas: readonly Cota[];
}

/** El valor de una cota, sin decimales de más («100», «12,5»). */
export const textoDeCota = (valor: number): string => String(Math.round(valor * 10) / 10).replace(".", ",");

function CotaSvg({ cota, vista }: { cota: Cota; vista: Vista }): ReactElement {
  const color = cota.igual ? COLOR_IGUAL : COLOR_COTA;
  const horizontal = cota.orientacion === "horizontal";
  const a = horizontal ? { x: cota.desde * vista.zoom + vista.x, y: cota.posicion * vista.zoom + vista.y } : { x: cota.posicion * vista.zoom + vista.x, y: cota.desde * vista.zoom + vista.y };
  const b = horizontal ? { x: cota.hasta * vista.zoom + vista.x, y: a.y } : { x: a.x, y: cota.hasta * vista.zoom + vista.y };
  const marca = 4;
  return (
    <g data-cota={cota.igual ? "igual" : "distancia"} data-valor={textoDeCota(cota.valor)}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1} />
      {horizontal ? (
        <>
          <line x1={a.x} y1={a.y - marca} x2={a.x} y2={a.y + marca} stroke={color} strokeWidth={1} />
          <line x1={b.x} y1={b.y - marca} x2={b.x} y2={b.y + marca} stroke={color} strokeWidth={1} />
        </>
      ) : (
        <>
          <line x1={a.x - marca} y1={a.y} x2={a.x + marca} y2={a.y} stroke={color} strokeWidth={1} />
          <line x1={b.x - marca} y1={b.y} x2={b.x + marca} y2={b.y} stroke={color} strokeWidth={1} />
        </>
      )}
      <text x={(a.x + b.x) / 2 + (horizontal ? 0 : 6)} y={(a.y + b.y) / 2 + (horizontal ? -5 : 3)} fontSize={10} textAnchor={horizontal ? "middle" : "start"} fill={color}>
        {textoDeCota(cota.valor)}
      </text>
    </g>
  );
}

/** Se pinta encima de todo y no recibe clics. No deja nada al soltar: el editor la vacía al terminar el gesto. */
export function MedidasCapa({ vista, medida, cotas }: MedidasCapaProps): ReactElement | null {
  if (!medida && cotas.length === 0) return null;
  return (
    <g data-capa="medidas" pointerEvents="none">
      {cotas.map((c, i) => (
        <CotaSvg key={`${c.orientacion}${c.desde}${c.hasta}${i}`} cota={c} vista={vista} />
      ))}
      {medida ? (
        <g data-medida="" transform={`translate(${medida.x + 14} ${medida.y + 18})`}>
          <rect x={-4} y={-11} width={medida.texto.length * 6.4 + 8} height={16} rx={3} fill="#0f172a" opacity={0.85} />
          <text x={0} y={1} fontSize={11} fill="#ffffff">
            {medida.texto}
          </text>
        </g>
      ) : null}
    </g>
  );
}
