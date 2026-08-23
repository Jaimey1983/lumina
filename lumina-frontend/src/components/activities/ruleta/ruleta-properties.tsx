'use client'

import React, { useCallback } from 'react'
import { RuletaActivity } from '@/types/slide.types'
import { generarIdRuleta, RULETA_MAX_ITEMS, RULETA_MIN_ITEMS } from './ruleta-config'

interface RuletaPropertiesProps {
  actividad: RuletaActivity
  onChange: (actividad: RuletaActivity) => void
}

export function RuletaProperties({ actividad, onChange }: RuletaPropertiesProps) {
  const { configuracion, items } = actividad

  const update = useCallback((partial: Partial<RuletaActivity>) => {
    onChange({ ...actividad, ...partial })
  }, [actividad, onChange])

  const updateConfig = useCallback((partial: Partial<RuletaActivity['configuracion']>) => {
    update({ configuracion: { ...configuracion, ...partial } })
  }, [configuracion, update])

  const addItem = useCallback(() => {
    if (items.length >= RULETA_MAX_ITEMS) return
    const id = generarIdRuleta('i')
    update({ items: [...items, { id, texto: `Elemento ${items.length + 1}` }] })
  }, [items, update])

  const removeItem = useCallback((id: string) => {
    if (items.length <= RULETA_MIN_ITEMS) return
    update({ items: items.filter(i => i.id !== id) })
  }, [items, update])

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">

      {/* Configuración */}
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Duración del giro</span>
            <select
              value={configuracion.duracionGiro}
              onChange={e => updateConfig({ duracionGiro: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={2000}>Rápido (2s)</option>
              <option value={3000}>Normal (3s)</option>
              <option value={4500}>Lento (4.5s)</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Mostrar ganador</span>
            <input
              type="checkbox"
              checked={configuracion.mostrarGanador}
              onChange={e => updateConfig({ mostrarGanador: e.target.checked })}
            />
          </label>
        </div>
      </section>

      {/* Items */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Elementos ({items.length})</h4>
          <button
            onClick={addItem}
            disabled={items.length >= RULETA_MAX_ITEMS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: configuracion.colores[idx % configuracion.colores.length] }}
              />
              <input
                type="text"
                value={item.texto}
                onChange={e => update({ items: items.map(i => i.id === item.id ? { ...i, texto: e.target.value } : i) })}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                onClick={() => removeItem(item.id)}
                disabled={items.length <= RULETA_MIN_ITEMS}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
              >✕</button>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
