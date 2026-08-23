'use client'

import React, { useCallback } from 'react'
import { AnagramaActivity } from '@/types/slide.types'
import { ANAGRAMA_MAX_PALABRAS, ANAGRAMA_MIN_PALABRAS } from './anagrama-config'

interface AnagramaPropertiesProps {
  actividad: AnagramaActivity
  onChange: (actividad: AnagramaActivity) => void
}

export function AnagramaProperties({ actividad, onChange }: AnagramaPropertiesProps) {
  const { configuracion, palabras } = actividad

  const update = useCallback((partial: Partial<AnagramaActivity>) => {
    onChange({ ...actividad, ...partial })
  }, [actividad, onChange])

  const updateConfig = useCallback((partial: Partial<typeof configuracion>) => {
    update({ configuracion: { ...configuracion, ...partial } })
  }, [configuracion, update])

  const addPalabra = useCallback(() => {
    if (palabras.length >= ANAGRAMA_MAX_PALABRAS) return
    update({ palabras: [...palabras, { texto: 'PALABRA', pista: '' }] })
  }, [palabras, update])

  const removePalabra = useCallback((idx: number) => {
    if (palabras.length <= ANAGRAMA_MIN_PALABRAS) return
    update({ palabras: palabras.filter((_, i) => i !== idx) })
  }, [palabras, update])

  const updatePalabra = useCallback((idx: number, campo: 'texto' | 'pista', valor: string) => {
    update({
      palabras: palabras.map((p, i) =>
        i === idx ? { ...p, [campo]: campo === 'texto' ? valor.toUpperCase() : valor } : p
      ),
    })
  }, [palabras, update])

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
          <div>
            <label className="text-xs text-gray-700 block mb-1">Intentos por palabra</label>
            <select
              value={configuracion.intentos}
              onChange={e => updateConfig({ intentos: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
            >
              <option value="0">Ilimitados</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Palabras */}
      <div className="bg-gray-50 p-3 rounded border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-800">
            Palabras ({palabras.length})
          </h4>
          <button
            onClick={addPalabra}
            disabled={palabras.length >= ANAGRAMA_MAX_PALABRAS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40 hover:bg-blue-600"
          >
            + Añadir
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {palabras.map((p, idx) => (
            <div key={idx} className="bg-white p-2 rounded border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">#{idx + 1}</span>
                <button
                  onClick={() => removePalabra(idx)}
                  disabled={palabras.length <= ANAGRAMA_MIN_PALABRAS}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 disabled:opacity-40 hover:bg-red-200"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                value={p.texto}
                onChange={e => updatePalabra(idx, 'texto', e.target.value)}
                placeholder="PALABRA"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-full font-mono uppercase"
              />
              {configuracion.mostrarPista && (
                <input
                  type="text"
                  value={p.pista || ''}
                  onChange={e => updatePalabra(idx, 'pista', e.target.value)}
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
