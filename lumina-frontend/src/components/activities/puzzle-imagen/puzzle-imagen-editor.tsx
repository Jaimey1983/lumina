'use client';

import React from 'react';
import { PuzzleImagenActivity } from '@/types/slide.types';
import { totalPiezas } from './puzzle-imagen-config';

interface PuzzleImagenEditorProps {
  actividad: PuzzleImagenActivity;
  isSelected?: boolean;
}

export function PuzzleImagenEditor({ actividad }: PuzzleImagenEditorProps) {
  const { configuracion, imagen } = actividad;
  const { filas, columnas } = configuracion;
  const total = totalPiezas(filas, columnas);

  return (
    <div className="w-full h-full flex flex-col gap-3 p-3 select-none">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Puzzle de imagen
        </span>
        <span className="text-xs text-gray-400">
          {filas}×{columnas} ({total} piezas)
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {imagen ? (
          <div
            className="w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${columnas}, 1fr)`,
              gridTemplateRows: `repeat(${filas}, 1fr)`,
              gap: '2px',
            }}
          >
            {Array.from({ length: total }).map((_, i) => {
              const row = Math.floor(i / columnas);
              const col = i % columnas;
              return (
                <div
                  key={i}
                  className="rounded-sm overflow-hidden"
                  style={{
                    backgroundImage: `url(${imagen})`,
                    backgroundSize: `${columnas * 100}% ${filas * 100}%`,
                    backgroundPosition: `${col * (100 / (columnas - 1))}% ${row * (100 / (filas - 1))}%`,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-400 w-full h-full border-2 border-dashed border-gray-300 rounded-xl">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Sube una imagen en el panel de propiedades</span>
          </div>
        )}
      </div>
    </div>
  );
}
