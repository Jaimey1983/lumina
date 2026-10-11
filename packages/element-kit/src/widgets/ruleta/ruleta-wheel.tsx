'use client';

import { forwardRef } from 'react';

import { calcularSectores, dividirEtiqueta, pesoDe } from './ruleta-config.js';

interface RuletaWheelProps {
  items: { texto: string; peso?: number }[];
  colores: string[];
  /**
   * Índice de color de cada sector. Si se omite, el sector `i` usa `colores[i]`; el visor lo
   * pasa en el modo «eliminar ganador» para que los colores no se corran al quitar un sector.
   */
  indicesColor?: number[];
}

const VIEW = 400;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R = VIEW / 2 - 8;

export const RuletaWheel = forwardRef<HTMLDivElement, RuletaWheelProps>(function RuletaWheel(
  { items, colores, indicesColor },
  ref,
) {
  const n = Math.max(items.length, 1);
  const sectores = calcularSectores(n, items.length > 0 ? items.map((it) => pesoDe(it)) : undefined);
  const fontSize = n > 8 ? 14 : n > 6 ? 16 : 18;
  // Caracteres por línea y líneas máximas según cuánto sector hay: más ítems, menos espacio.
  const maxPorLinea = n > 8 ? 10 : n > 6 ? 12 : 14;
  const maxLineas = n > 8 ? 2 : 3;

  return (
    <div className="relative h-full w-full max-h-full aspect-square flex items-center justify-center mx-auto">
      <div ref={ref} className="absolute inset-0 origin-center will-change-transform">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="h-full w-full overflow-visible drop-shadow-lg"
        >
          {sectores.map((s, i) => {
            const x1 = CX + R * Math.cos(s.inicio);
            const y1 = CY + R * Math.sin(s.inicio);
            const x2 = CX + R * Math.cos(s.fin);
            const y2 = CY + R * Math.sin(s.fin);
            const largeArc = s.fin - s.inicio > Math.PI ? 1 : 0;
            const tx = CX + R * 0.62 * Math.cos(s.angulo);
            const ty = CY + R * 0.62 * Math.sin(s.angulo);
            const midDeg = (s.angulo * 180) / Math.PI;
            const labelRot = Math.cos(s.angulo) < 0 ? midDeg + 180 : midDeg;
            const label = items[i]?.texto ?? '';
            const lineas = dividirEtiqueta(label, maxPorLinea, maxLineas);
            // Una línea larga achica la letra (hasta 10) para no pasar del borde de la rueda.
            const mayorLinea = Math.max(...lineas.map((l) => l.length));
            const tamano = mayorLinea > 11 ? Math.max(10, (fontSize * 11) / mayorLinea) : fontSize;
            const alturaLinea = tamano * 1.1;

            return (
              <g key={i}>
                <path
                  d={`M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={colores[(indicesColor?.[i] ?? i) % colores.length]}
                  stroke="white"
                  strokeWidth="3"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={tamano}
                  fontWeight="bold"
                  transform={`rotate(${labelRot} ${tx} ${ty})`}
                >
                  {lineas.length === 1
                    ? lineas[0]
                    : lineas.map((linea, k) => (
                        <tspan
                          key={k}
                          x={tx}
                          dy={k === 0 ? -((lineas.length - 1) * alturaLinea) / 2 : alturaLinea}
                        >
                          {linea}
                        </tspan>
                      ))}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={VIEW * 0.055} fill="white" stroke="#D1D5DB" strokeWidth="4" />
        </svg>
      </div>

      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <polygon
          points={`${CX},${CY - R + 18} ${CX - 16},${CY - R - 22} ${CX + 16},${CY - R - 22}`}
          fill="#1F2937"
        />
      </svg>
    </div>
  );
});
