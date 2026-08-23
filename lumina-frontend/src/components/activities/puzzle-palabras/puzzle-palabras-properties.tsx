'use client'

import React, { useCallback } from 'react'
import { PuzzlePalabrasActivity } from '@/types/slide.types'
import {
  PUZZLE_PALABRAS_MAX_ORACIONES,
  PUZZLE_PALABRAS_MIN_ORACIONES,
} from './puzzle-palabras-config'

interface PuzzlePalabrasPropertiesProps {
  actividad: PuzzlePalabrasActivity
  onChange: (actividad: PuzzlePalabrasActivity) => void
}

export function PuzzlePalabrasProperties({ actividad, onChange }: PuzzlePalabrasPropertiesProps) {
  const { configuracion, oraciones } = actividad

  const update = useCallback((partial: Partial<PuzzlePalabrasActivity>) => {
    onChange({ ...actividad, ...partial })
  }, [actividad, onChange])

  const updateConfig = useCallback((partial: Partial<typeof configuracion>) => {
    update({ configuracion: { ...configuracion, ...partial } })
  }, [configuracion, update])

  const addOracion = useCallback(() => {
    if (oraciones.length >= PUZZLE_PALABRAS_MAX_ORACIONES) return
    update({ oraciones: [...oraciones, { texto: 'Escribe una oración aquí' }] })
  }, [oraciones, update])

  const removeOracion = useCallback((idx: number) => {
    if (oraciones.length <= PUZZLE_PALABRAS_MIN_ORACIONES) return
    update({ oraciones: oraciones.filter((_, i) => i !== idx) })
  }, [oraciones, update])

  const updateOracion = useCallback((idx: number, campo: 'texto' | 'pista', valor: string) => {
    update({
      oraciones: oraciones.map((o, i) =>
        i === idx ? { ...o, [campo]: valor } : o
      ),
    })
  }, [oraciones, update])

  return (
    <div className="space-y-4">
      {/* Configuración */}
      <div className="bg-gray-50 p-3 rounded border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Configuración</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={configuracion.mostrarPista}
              onChange={e => updateConfig({ mostrarPista: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Mostrar pista</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={configuracion.permitirReintento}
              onChange={e => updateConfig({ permitirReintento: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Permitir reintento</span>
          </label>
        </div>
      </div>

      {/* Oraciones */}
      <div className="bg-gray-50 p-3 rounded border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-800">
            Oraciones ({oraciones.length})
          </h4>
          <button
            onClick={addOracion}
            disabled={oraciones.length >= PUZZLE_PALABRAS_MAX_ORACIONES}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40 hover:bg-blue-600"
          >
            + Añadir
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {oraciones.map((o, idx) => (
            <div key={idx} className="bg-white p-2 rounded border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">#{idx + 1}</span>
                <button
                  onClick={() => removeOracion(idx)}
                  disabled={oraciones.length <= PUZZLE_PALABRAS_MIN_ORACIONES}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 disabled:opacity-40 hover:bg-red-200"
                >
                  ✕
                </button>
              </div>

              <textarea
                value={o.texto}
                onChange={e => updateOracion(idx, 'texto', e.target.value)}
                placeholder="Escribe la oración completa..."
                rows={2}
                className="rounded border border-gray-300 px-2 py-1 text-xs w-full resize-none"
              />
              {configuracion.mostrarPista && (
                <input
                  type="text"
                  value={o.pista || ''}
                  onChange={e => updateOracion(idx, 'pista', e.target.value)}
                  placeholder="Pista (opcional)"
                  className="rounded border border-gray-300 px-2 py-1 text-xs w-full text-gray-600"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
