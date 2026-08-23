'use client';

import React, { useCallback } from 'react';
import { CrucigramaActivity, CrucigramaPalabra } from '@/types/slide.types';
import {
  generarIdCrucigrama,
  CRUCIGRAMA_MAX_PALABRAS,
  CRUCIGRAMA_MIN_PALABRAS,
  detectarConflictosInterseccion,
} from './crucigrama-config';

interface CrucigramaPropertiesProps {
  actividad: CrucigramaActivity;
  onChange: (actividad: CrucigramaActivity) => void;
}

export function CrucigramaProperties({ actividad, onChange }: CrucigramaPropertiesProps) {
  const { configuracion, palabras } = actividad;
  const conflictos = detectarConflictosInterseccion(palabras);

  const update = useCallback(
    (partial: Partial<CrucigramaActivity>) => {
      onChange({ ...actividad, ...partial });
    },
    [actividad, onChange],
  );

  const updateConfig = useCallback(
    (partial: Partial<CrucigramaActivity['configuracion']>) => {
      update({ configuracion: { ...configuracion, ...partial } });
    },
    [configuracion, update],
  );

  const addPalabra = useCallback(() => {
    if (palabras.length >= CRUCIGRAMA_MAX_PALABRAS) return;
    const id = generarIdCrucigrama('p');
    update({
      palabras: [
        ...palabras,
        {
          id,
          texto: 'PALABRA',
          pista: 'Escribe la pista aquí',
          direccion: 'horizontal',
          fila: 0,
          columna: 0,
        },
      ],
    });
  }, [palabras, update]);

  const removePalabra = useCallback(
    (id: string) => {
      if (palabras.length <= CRUCIGRAMA_MIN_PALABRAS) return;
      update({ palabras: palabras.filter((p) => p.id !== id) });
    },
    [palabras, update],
  );

  const updatePalabra = useCallback(
    (id: string, partial: Partial<CrucigramaPalabra>) => {
      update({
        palabras: palabras.map((p) =>
          p.id === id
            ? { ...p, ...partial, texto: partial.texto ? partial.texto.toUpperCase() : p.texto }
            : p,
        ),
      });
    },
    [palabras, update],
  );

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Apariencia</h4>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] leading-snug text-gray-500">
            El tamaño de las celdas se ajusta automáticamente al canvas.
          </p>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Color celda</span>
            <input
              type="color"
              value={configuracion.colorCelda}
              onChange={(e) => updateConfig({ colorCelda: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Color texto</span>
            <input
              type="color"
              value={configuracion.colorTexto}
              onChange={(e) => updateConfig({ colorTexto: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
          </label>
        </div>
      </section>
      {conflictos.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-snug text-red-700">
          Hay {conflictos.length} intersección(es) con letras distintas. Ajusta fila/col para que
          coincidan (p. ej. MAR y LUNA deben compartir la misma letra en la celda común).
        </div>
      )}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Palabras ({palabras.length})</h4>
          <button
            onClick={addPalabra}
            disabled={palabras.length >= CRUCIGRAMA_MAX_PALABRAS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {palabras.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                <button
                  onClick={() => removePalabra(p.id)}
                  disabled={palabras.length <= CRUCIGRAMA_MIN_PALABRAS}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={p.texto}
                onChange={(e) => updatePalabra(p.id, { texto: e.target.value })}
                placeholder="TEXTO"
                className="rounded border border-gray-300 px-2 py-1 text-xs font-mono uppercase w-full"
              />
              <input
                type="text"
                value={p.pista}
                onChange={(e) => updatePalabra(p.id, { pista: e.target.value })}
                placeholder="Pista"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
              />
              <div className="flex gap-2">
                <select
                  value={p.direccion}
                  onChange={(e) =>
                    updatePalabra(p.id, {
                      direccion: e.target.value as 'horizontal' | 'vertical',
                    })
                  }
                  className="flex-1 rounded border border-gray-300 px-1 py-1 text-xs"
                >
                  <option value="horizontal">→ Horizontal</option>
                  <option value="vertical">↓ Vertical</option>
                </select>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  Fila
                  <input
                    type="number"
                    min={0}
                    value={p.fila}
                    onChange={(e) =>
                      updatePalabra(p.id, { fila: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-12 rounded border border-gray-300 px-1 py-0.5 text-xs"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  Col
                  <input
                    type="number"
                    min={0}
                    value={p.columna}
                    onChange={(e) =>
                      updatePalabra(p.id, { columna: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-12 rounded border border-gray-300 px-1 py-0.5 text-xs"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
