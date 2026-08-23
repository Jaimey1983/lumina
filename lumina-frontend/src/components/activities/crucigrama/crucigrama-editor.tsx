'use client';

import React, { useMemo, useRef } from 'react';
import { CrucigramaActivity } from '@/types/slide.types';
import { calcularBounds, construirMapaCeldas, numerarPalabras } from './crucigrama-config';
import {
  CRUCIGRAMA_GAP_PX,
  tamanoFuenteCeldaCrucigrama,
  tamanoNumeroCeldaCrucigrama,
  useCrucigramaCellSize,
} from './crucigrama-shared';

interface CrucigramaEditorProps {
  actividad: CrucigramaActivity;
  isSelected?: boolean;
}

export function CrucigramaEditor({ actividad }: CrucigramaEditorProps) {
  const { configuracion, palabras } = actividad;
  const { colorCelda, colorTexto } = configuracion;
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const bounds = useMemo(() => calcularBounds(palabras), [palabras]);
  const mapaCeldas = useMemo(() => construirMapaCeldas(palabras), [palabras]);
  const numeracion = useMemo(() => numerarPalabras(palabras), [palabras]);
  const filas = bounds.maxFila - bounds.minFila + 1;
  const columnas = bounds.maxCol - bounds.minCol + 1;
  const cellSize = useCrucigramaCellSize(gridAreaRef, filas, columnas);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3 select-none">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Crucigrama
        </span>
        <span className="text-xs text-gray-400">{palabras.length} palabras</span>
      </div>

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
              gap: CRUCIGRAMA_GAP_PX,
            }}
          >
            {Array.from({ length: filas }, (_, r) =>
              Array.from({ length: columnas }, (_, c) => {
                const fila = r + bounds.minFila;
                const col = c + bounds.minCol;
                const key = `${fila}-${col}`;
                const celda = mapaCeldas.get(key);
                const numPista = palabras.find((p) => p.fila === fila && p.columna === col);
                const numero = numPista ? numeracion.get(numPista.id) : undefined;

                if (!celda) {
                  return (
                    <div
                      key={key}
                      style={{ width: cellSize, height: cellSize }}
                      aria-hidden
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: celda.conflicto ? '#FEF2F2' : colorCelda,
                      border: celda.conflicto ? '1px solid #DC2626' : '1px solid #D1D5DB',
                      position: 'relative',
                      fontSize: tamanoFuenteCeldaCrucigrama(cellSize),
                      color: colorTexto,
                    }}
                    className="flex items-center justify-center font-bold"
                  >
                    {numero && (
                      <span
                        className="absolute left-0.5 top-0 font-normal leading-none text-gray-500"
                        style={{ fontSize: tamanoNumeroCeldaCrucigrama(cellSize) }}
                      >
                        {numero}
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
