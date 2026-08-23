'use client';

import React from 'react';
import { MemoriaActivity } from '@/types/slide.types';
import { calcularFilasMemoria } from './memoria-config';
import {
  colorSimboloDorsoMemoria,
  memoriaCardSurfaceClass,
  RenderMemoriaDorso,
  simboloDorsoMemoria,
} from './memoria-shared';

interface MemoriaEditorProps {
  actividad: MemoriaActivity;
  isSelected?: boolean;
}

export function MemoriaEditor({ actividad }: MemoriaEditorProps) {
  const { configuracion, pares } = actividad;
  const totalCartas = pares.length * 2;
  const columnas = Math.max(1, configuracion.columnas);
  const filas = calcularFilasMemoria(totalCartas, columnas);
  const simbolo = simboloDorsoMemoria(configuracion);
  const colorSimbolo = colorSimboloDorsoMemoria(configuracion);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3 select-none">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Memoria
        </span>
        <span className="text-xs text-gray-400">
          {pares.length} pares · {totalCartas} cartas
        </span>
      </div>

      <div
        className="grid min-h-0 flex-1 gap-1.5 overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${filas}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalCartas }).map((_, i) => (
          <div
            key={i}
            className={memoriaCardSurfaceClass}
            style={{ backgroundColor: configuracion.colorDorso }}
          >
            <RenderMemoriaDorso simbolo={simbolo} color={colorSimbolo} />
          </div>
        ))}
      </div>
    </div>
  );
}
