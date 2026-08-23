'use client';

import React from 'react';
import type { MatchPairs } from '@/types/slide.types';
import { RenderLado } from './emparejar-shared';
import { ladoTieneImagen } from './emparejar-config';

interface EmparejarEditorProps {
  actividad: MatchPairs;
  isSelected?: boolean;
}

export function EmparejarEditor({ actividad }: EmparejarEditorProps) {
  const { instruccion, pares } = actividad;

  return (
    <div className="w-full h-full flex flex-col gap-2 p-3 select-none overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Emparejar
        </span>
        <span className="text-xs text-gray-400">{pares.length} pares</span>
      </div>
      {instruccion && (
        <p className="text-xs text-gray-500 truncate px-1">{instruccion}</p>
      )}
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
        <div className="flex flex-col gap-1.5 min-w-0">
          {pares.map((par) => {
            const tieneImagen = ladoTieneImagen(par.izquierda);
            return (
              <div
                key={par.id}
                className={`flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-1.5 overflow-hidden ${
                  tieneImagen ? 'min-h-[48px]' : 'min-h-[28px]'
                }`}
              >
                <RenderLado lado={par.izquierda} />
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          {pares.map((par) => {
            const tieneImagen = ladoTieneImagen(par.derecha);
            return (
              <div
                key={par.id}
                className={`flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-1.5 overflow-hidden ${
                  tieneImagen ? 'min-h-[48px]' : 'min-h-[28px]'
                }`}
              >
                <RenderLado lado={par.derecha} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
