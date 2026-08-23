'use client';

import React, { useCallback } from 'react';
import { SopaLetrasActivity, SopaLetrasPalabra } from '@/types/slide.types';
import {
  SOPA_LETRAS_MAX_PALABRAS,
  SOPA_LETRAS_MIN_PALABRAS,
  SOPA_LETRAS_MIN_FILAS,
  SOPA_LETRAS_MAX_FILAS,
  SOPA_LETRAS_MIN_COLUMNAS,
  SOPA_LETRAS_MAX_COLUMNAS,
  Direccion,
} from './sopa-letras-config';

interface SopaLetrasPropertiesProps {
  actividad: SopaLetrasActivity;
  onChange: (actividad: SopaLetrasActivity) => void;
}

export function SopaLetrasProperties({ actividad, onChange }: SopaLetrasPropertiesProps) {
  const { configuracion, palabras } = actividad;

  const update = useCallback(
    (partial: Partial<SopaLetrasActivity>) => {
      onChange({ ...actividad, ...partial, grid: undefined });
    },
    [actividad, onChange],
  );

  const updateConfig = useCallback(
    (partial: Partial<SopaLetrasActivity['configuracion']>) => {
      update({ configuracion: { ...configuracion, ...partial } });
    },
    [configuracion, update],
  );

  const toggleDireccion = useCallback(
    (dir: Direccion) => {
      const dirs = configuracion.direcciones;
      const nuevas = dirs.includes(dir) ? dirs.filter((d) => d !== dir) : [...dirs, dir];
      if (nuevas.length === 0) return;
      updateConfig({ direcciones: nuevas });
    },
    [configuracion.direcciones, updateConfig],
  );

  const addPalabra = useCallback(() => {
    if (palabras.length >= SOPA_LETRAS_MAX_PALABRAS) return;
    update({ palabras: [...palabras, { texto: 'PALABRA' }] });
  }, [palabras, update]);

  const removePalabra = useCallback(
    (idx: number) => {
      if (palabras.length <= SOPA_LETRAS_MIN_PALABRAS) return;
      update({ palabras: palabras.filter((_, i) => i !== idx) });
    },
    [palabras, update],
  );

  const updatePalabra = useCallback(
    (idx: number, campo: keyof SopaLetrasPalabra, valor: string) => {
      update({
        palabras: palabras.map((p, i) =>
          i === idx ? { ...p, [campo]: campo === 'texto' ? valor.toUpperCase() : valor } : p,
        ),
      });
    },
    [palabras, update],
  );

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Filas</span>
            <input
              type="number"
              min={SOPA_LETRAS_MIN_FILAS}
              max={SOPA_LETRAS_MAX_FILAS}
              value={configuracion.filas}
              onChange={(e) =>
                updateConfig({
                  filas: Math.max(
                    SOPA_LETRAS_MIN_FILAS,
                    Math.min(SOPA_LETRAS_MAX_FILAS, Number(e.target.value)),
                  ),
                })
              }
              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Columnas</span>
            <input
              type="number"
              min={SOPA_LETRAS_MIN_COLUMNAS}
              max={SOPA_LETRAS_MAX_COLUMNAS}
              value={configuracion.columnas}
              onChange={(e) =>
                updateConfig({
                  columnas: Math.max(
                    SOPA_LETRAS_MIN_COLUMNAS,
                    Math.min(SOPA_LETRAS_MAX_COLUMNAS, Number(e.target.value)),
                  ),
                })
              }
              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
          <div className="flex items-start justify-between gap-2">
            <span className="text-gray-600">Direcciones</span>
            <div className="flex flex-col gap-1">
              {(['horizontal', 'vertical', 'diagonal'] as Direccion[]).map((dir) => (
                <label key={dir} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configuracion.direcciones.includes(dir)}
                    onChange={() => toggleDireccion(dir)}
                  />
                  <span className="text-xs capitalize text-gray-600">{dir}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Mostrar lista</span>
            <input
              type="checkbox"
              checked={configuracion.mostrarLista}
              onChange={(e) => updateConfig({ mostrarLista: e.target.checked })}
            />
          </label>
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Palabras ({palabras.length})</h4>
          <button
            onClick={addPalabra}
            disabled={palabras.length >= SOPA_LETRAS_MAX_PALABRAS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {palabras.map((p, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={p.texto}
                  onChange={(e) => updatePalabra(idx, 'texto', e.target.value)}
                  placeholder="PALABRA"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs font-mono uppercase"
                />
                <button
                  onClick={() => removePalabra(idx)}
                  disabled={palabras.length <= SOPA_LETRAS_MIN_PALABRAS}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={p.pista ?? ''}
                onChange={(e) => updatePalabra(idx, 'pista', e.target.value)}
                placeholder="Pista (opcional)"
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-500 w-full"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
