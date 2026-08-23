'use client'

import React, { useCallback } from 'react'
import { TopoActivity, TopoPregunta } from '@/types/slide.types'
import { generarIdTopo, TOPO_MAX_PREGUNTAS, TOPO_MIN_PREGUNTAS } from './topo-config'

interface TopoPropertiesProps {
  actividad: TopoActivity
  onChange: (actividad: TopoActivity) => void
}

export function TopoProperties({ actividad, onChange }: TopoPropertiesProps) {
  const { configuracion, preguntas } = actividad

  const update = useCallback((partial: Partial<TopoActivity>) => {
    onChange({ ...actividad, ...partial })
  }, [actividad, onChange])

  const updateConfig = useCallback((partial: Partial<TopoActivity['configuracion']>) => {
    update({ configuracion: { ...configuracion, ...partial } })
  }, [configuracion, update])

  const addPregunta = useCallback(() => {
    if (preguntas.length >= TOPO_MAX_PREGUNTAS) return
    const id = generarIdTopo('q')
    update({
      preguntas: [...preguntas, {
        id,
        enunciado: 'Nueva pregunta',
        opciones: [
          { texto: 'Correcta', correcta: true },
          { texto: 'Incorrecta', correcta: false },
          { texto: 'Incorrecta', correcta: false },
        ],
      }],
    })
  }, [preguntas, update])

  const removePregunta = useCallback((id: string) => {
    if (preguntas.length <= TOPO_MIN_PREGUNTAS) return
    update({ preguntas: preguntas.filter(p => p.id !== id) })
  }, [preguntas, update])

  const updatePregunta = useCallback((id: string, partial: Partial<TopoPregunta>) => {
    update({ preguntas: preguntas.map(p => p.id === id ? { ...p, ...partial } : p) })
  }, [preguntas, update])

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">

      {/* Configuración */}
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Velocidad</span>
            <select
              value={configuracion.velocidad}
              onChange={e => updateConfig({ velocidad: e.target.value as 'lenta' | 'normal' | 'rapida' })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="lenta">Lenta</option>
              <option value="normal">Normal</option>
              <option value="rapida">Rápida</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Vidas</span>
            <select
              value={configuracion.vidas}
              onChange={e => updateConfig({ vidas: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Tiempo límite (s)</span>
            <select
              value={configuracion.tiempoLimite}
              onChange={e => updateConfig({ tiempoLimite: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              {[30, 45, 60, 90, 120].map(t => <option key={t} value={t}>{t}s</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Filas</span>
            <select
              value={configuracion.filas}
              onChange={e => updateConfig({ filas: Number(e.target.value) as 2 | 3 })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Columnas</span>
            <select
              value={configuracion.columnas}
              onChange={e => updateConfig({ columnas: Number(e.target.value) as 3 | 4 })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
        </div>
      </section>

      {/* Preguntas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Preguntas ({preguntas.length})</h4>
          <button
            onClick={addPregunta}
            disabled={preguntas.length >= TOPO_MAX_PREGUNTAS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {preguntas.map((p, idx) => (
            <div key={p.id} className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                <button
                  onClick={() => removePregunta(p.id)}
                  disabled={preguntas.length <= TOPO_MIN_PREGUNTAS}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
                >✕</button>
              </div>
              <input
                type="text"
                value={p.enunciado}
                onChange={e => updatePregunta(p.id, { enunciado: e.target.value })}
                placeholder="Enunciado"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
              />
              {p.opciones.map((op, oi) => (
                <div key={oi} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={op.correcta}
                    onChange={() => updatePregunta(p.id, {
                      opciones: p.opciones.map((o, i) => ({ ...o, correcta: i === oi })),
                    })}
                  />
                  <input
                    type="text"
                    value={op.texto}
                    onChange={e => updatePregunta(p.id, {
                      opciones: p.opciones.map((o, i) => i === oi ? { ...o, texto: e.target.value } : o),
                    })}
                    className="flex-1 rounded border border-gray-300 px-2 py-0.5 text-xs"
                    placeholder={`Opción ${oi + 1}`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
