'use client';

import React, { useCallback } from 'react';
import { PuzzleImagenActivity } from '@/types/slide.types';

interface PuzzleImagenPropertiesProps {
  actividad: PuzzleImagenActivity;
  onChange: (actividad: PuzzleImagenActivity) => void;
}

export function PuzzleImagenProperties({ actividad, onChange }: PuzzleImagenPropertiesProps) {
  const { configuracion, imagen } = actividad;

  const update = useCallback(
    (partial: Partial<PuzzleImagenActivity>) => {
      onChange({ ...actividad, ...partial });
    },
    [actividad, onChange],
  );

  const updateConfig = useCallback(
    (partial: Partial<PuzzleImagenActivity['configuracion']>) => {
      update({ configuracion: { ...configuracion, ...partial } });
    },
    [configuracion, update],
  );

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Imagen</h4>
        {imagen ? (
          <div className="flex flex-col gap-2">
            <img
              src={imagen}
              alt="Puzzle"
              className="w-full rounded-lg border border-gray-200 object-cover max-h-32"
            />
            <button
              type="button"
              onClick={() => update({ imagen: '' })}
              className="text-xs text-red-500 hover:text-red-700 self-start"
            >
              Eliminar imagen
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            Usa el panel de medios para subir una imagen
          </div>
        )}
        <div className="mt-2">
          <label className="text-xs text-gray-600 block mb-1">URL de imagen</label>
          <input
            type="text"
            value={imagen}
            onChange={(e) => update({ imagen: e.target.value })}
            placeholder="https://..."
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Filas</span>
            <select
              value={configuracion.filas}
              onChange={(e) =>
                updateConfig({ filas: Number(e.target.value) as 3 | 4 | 5 })
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Columnas</span>
            <select
              value={configuracion.columnas}
              onChange={(e) =>
                updateConfig({ columnas: Number(e.target.value) as 3 | 4 | 5 })
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Dificultad</span>
            <select
              value={configuracion.dificultad}
              onChange={(e) =>
                updateConfig({
                  dificultad: e.target.value as 'facil' | 'medio' | 'dificil',
                })
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="facil">Fácil (con números)</option>
              <option value="medio">Medio</option>
              <option value="dificil">Difícil (sin referencia)</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Mostrar miniatura</span>
            <input
              type="checkbox"
              checked={configuracion.mostrarVista}
              onChange={(e) => updateConfig({ mostrarVista: e.target.checked })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
