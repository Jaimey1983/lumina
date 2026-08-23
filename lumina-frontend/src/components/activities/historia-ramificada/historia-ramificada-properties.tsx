'use client'

import React, { useCallback } from 'react'
import { HistoriaRamificadaActivity } from '@/types/slide.types'

interface HistoriaRamificadaPropertiesProps {
  actividad: HistoriaRamificadaActivity
  onChange: (actividad: HistoriaRamificadaActivity) => void
}

export function HistoriaRamificadaProperties({ actividad, onChange }: HistoriaRamificadaPropertiesProps) {
  const { configuracion, nodos, conexiones, nodoInicial } = actividad

  const update = useCallback((partial: Partial<HistoriaRamificadaActivity>) => {
    onChange({ ...actividad, ...partial })
  }, [actividad, onChange])

  const updateConfig = useCallback((partial: Partial<HistoriaRamificadaActivity['configuracion']>) => {
    update({ configuracion: { ...configuracion, ...partial } })
  }, [configuracion, update])

  const totalNodos = nodos.length
  const totalConexiones = conexiones.length
  const nodosFinal = nodos.filter(n => n.tipo === 'final_bueno' || n.tipo === 'final_malo').length
  const nodosPreguntas = nodos.filter(n => n.tipo === 'pregunta').length

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">

      {/* Stats */}
      <section className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Estadísticas</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-500">Nodos: <span className="font-semibold text-gray-700">{totalNodos}</span></div>
          <div className="text-gray-500">Conexiones: <span className="font-semibold text-gray-700">{totalConexiones}</span></div>
          <div className="text-gray-500">Finales: <span className="font-semibold text-gray-700">{nodosFinal}</span></div>
          <div className="text-gray-500">Preguntas: <span className="font-semibold text-gray-700">{nodosPreguntas}</span></div>
        </div>
      </section>

      {/* Configuración */}
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Tema visual</span>
            <select
              value={configuracion.tema}
              onChange={e => updateConfig({ tema: e.target.value as any })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="neutro">Neutro</option>
              <option value="aventura">Aventura</option>
              <option value="ciencia">Ciencia</option>
              <option value="historia">Historia</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Mostrar progreso</span>
            <input
              type="checkbox"
              checked={configuracion.mostrarProgreso}
              onChange={e => updateConfig({ mostrarProgreso: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Permitir retroceder</span>
            <input
              type="checkbox"
              checked={configuracion.permitirRetroceder}
              onChange={e => updateConfig({ permitirRetroceder: e.target.checked })}
            />
          </label>
        </div>
      </section>

      {/* Nodo inicial */}
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Nodo inicial</h4>
        <select
          value={nodoInicial}
          onChange={e => update({ nodoInicial: e.target.value })}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
        >
          {nodos.map(n => (
            <option key={n.id} value={n.id}>
              {n.titulo ?? n.id} ({n.tipo})
            </option>
          ))}
        </select>
      </section>

      <p className="text-xs text-gray-400 italic">
        Edita los nodos y conexiones haciendo clic en el grafo del editor.
      </p>

    </div>
  )
}
