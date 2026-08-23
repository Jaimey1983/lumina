'use client';

import React, { useMemo, useRef } from 'react';
import { SopaLetrasActivity } from '@/types/slide.types';
import { generarGrid } from './sopa-letras-config';
import { SOPA_LETRAS_GAP_PX, tamanoFuenteCeldaSopa, useSopaGridCellSize } from './sopa-letras-shared';

interface SopaLetrasEditorProps {
  actividad: SopaLetrasActivity;
  isSelected?: boolean;
}

export function SopaLetrasEditor({ actividad }: SopaLetrasEditorProps) {
  const { configuracion, palabras, grid: gridGuardado } = actividad;
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const { filas, columnas } = configuracion;
  const cellSize = useSopaGridCellSize(gridAreaRef, filas, columnas);

  const grid = useMemo(() => {
    if (gridGuardado) return gridGuardado;
    const { grid: generated } = generarGrid(
      configuracion.filas,
      configuracion.columnas,
      palabras.map((p) => p.texto),
      configuracion.direcciones,
    );
    return generated;
  }, [gridGuardado, configuracion, palabras]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3 select-none">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Sopa de letras
        </span>
        <span className="text-xs text-gray-400">
          {filas}×{columnas} · {palabras.length} palabras
        </span>
      </div>

      {configuracion.mostrarLista && (
        <div className="flex shrink-0 flex-wrap gap-1">
          {palabras.map((p, i) => (
            <span
              key={i}
              className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700"
            >
              {p.texto.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <div
        ref={gridAreaRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        {cellSize > 0 && (
          <div
            className="grid shrink-0"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: SOPA_LETRAS_GAP_PX,
            }}
          >
            {grid.map((fila, r) =>
              fila.map((letra, c) => (
                <div
                  key={`${r}-${c}`}
                  className="flex items-center justify-center rounded-sm bg-gray-50 font-mono font-semibold text-gray-700"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    fontSize: tamanoFuenteCeldaSopa(cellSize),
                  }}
                >
                  {letra}
                </div>
              )),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
