'use client';

import React from 'react';
import { ClasificarActivity } from '@/types/slide.types';

interface ClasificarEditorProps {
  actividad: ClasificarActivity;
  isSelected?: boolean;
}

export function ClasificarEditor({ actividad }: ClasificarEditorProps) {
  const { configuracion, categorias, items } = actividad;
  const colores = configuracion.colorCategorias;

  return (
    <div className="w-full h-full flex flex-col gap-3 p-3 select-none">
      {/* Header informativo */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Clasificar
        </span>
        <span className="text-xs text-gray-400">
          {categorias.length} categorías · {items.length} elementos
        </span>
      </div>

      {/* Columnas de categorías */}
      <div
        className="flex-1 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${configuracion.columnas}, 1fr)` }}
      >
        {categorias.map((cat, idx) => {
          const colorFondo = colores[idx % colores.length];
          const itemsDeCat = items.filter((i) => i.categoriaId === cat.id);

          return (
            <div
              key={cat.id}
              className="rounded-lg flex flex-col gap-1 p-2 min-h-[80px]"
              style={{ backgroundColor: colorFondo + '22', border: `2px solid ${colorFondo}` }}
            >
              {/* Cabecera de categoría */}
              <div
                className="rounded-md px-2 py-1 text-center text-xs font-bold text-white truncate"
                style={{ backgroundColor: colorFondo }}
              >
                {cat.nombre}
              </div>
              {/* Ítems preview */}
              {itemsDeCat.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded px-2 py-1 bg-white text-xs text-gray-700 truncate shadow-sm"
                >
                  {item.texto}
                </div>
              ))}
              {itemsDeCat.length > 3 && (
                <div className="text-xs text-center text-gray-400">
                  +{itemsDeCat.length - 3} más
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
