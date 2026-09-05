'use client'

import React, { useCallback } from 'react'
import { GlobosActivity, GlobosPregunta } from '@/types/slide.types'
import {
  generarIdGlobos,
  GLOBOS_MAX_PREGUNTAS,
  GLOBOS_MIN_PREGUNTAS,
  GLOBOS_MIN_OPCIONES,
  GLOBOS_MAX_OPCIONES,
  crearOpcionesGlobosDefault,
} from './globos-config'

interface GlobosPropertiesProps {
  actividad: GlobosActivity
  onChange: (actividad: GlobosActivity) => void
}

export function GlobosProperties({ actividad, onChange }: GlobosPropertiesProps) {
  const { configuracion, preguntas } = actividad

  const update = useCallback(
    (partial: Partial<GlobosActivity>) => {
      onChange({ ...actividad, ...partial })
    },
    [actividad, onChange],
  )

  const updateConfig = useCallback(
    (partial: Partial<GlobosActivity['configuracion']>) => {
      update({ configuracion: { ...configuracion, ...partial } })
    },
    [configuracion, update],
  )

  const addPregunta = useCallback(() => {
    if (preguntas.length >= GLOBOS_MAX_PREGUNTAS) return
    update({
      preguntas: [
        ...preguntas,
        {
          id: generarIdGlobos('q'),
          enunciado: 'Nueva pregunta',
          opciones: crearOpcionesGlobosDefault(),
        },
      ],
    })
  }, [preguntas, update])

  const removePregunta = useCallback(
    (id: string) => {
      if (preguntas.length <= GLOBOS_MIN_PREGUNTAS) return
      update({ preguntas: preguntas.filter((p) => p.id !== id) })
    },
    [preguntas, update],
  )

  const updatePregunta = useCallback(
    (id: string, partial: Partial<GlobosPregunta>) => {
      update({
        preguntas: preguntas.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      })
    },
    [preguntas, update],
  )

  const addOpcion = useCallback(
    (preguntaId: string) => {
      const pregunta = preguntas.find((p) => p.id === preguntaId)
      if (!pregunta || pregunta.opciones.length >= GLOBOS_MAX_OPCIONES) return
      updatePregunta(preguntaId, {
        opciones: [
          ...pregunta.opciones,
          { texto: `Distractor ${pregunta.opciones.length}`, correcta: false },
        ],
      })
    },
    [preguntas, updatePregunta],
  )

  const removeOpcion = useCallback(
    (preguntaId: string, index: number) => {
      const pregunta = preguntas.find((p) => p.id === preguntaId)
      if (!pregunta || pregunta.opciones.length <= GLOBOS_MIN_OPCIONES) return
      updatePregunta(preguntaId, {
        opciones: pregunta.opciones.filter((_, i) => i !== index),
      })
    },
    [preguntas, updatePregunta],
  )

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <h4 className="mb-2 font-semibold text-gray-700">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Velocidad</span>
            <select
              value={configuracion.velocidad ?? 'normal'}
              onChange={(e) =>
                updateConfig({ velocidad: e.target.value as 'lenta' | 'normal' | 'rapida' })
              }
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
              value={configuracion.vidas ?? 3}
              onChange={(e) => updateConfig({ vidas: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Tiempo límite (s)</span>
            <select
              value={configuracion.tiempoLimite ?? 60}
              onChange={(e) => updateConfig({ tiempoLimite: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              {[30, 45, 60, 90, 120].map((t) => (
                <option key={t} value={t}>
                  {t}s
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-gray-400">
          Cada pregunta admite entre {GLOBOS_MIN_OPCIONES} y {GLOBOS_MAX_OPCIONES} globos. Marca
          una respuesta correcta y añade distractores con texto visible.
        </p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">Preguntas ({preguntas.length})</h4>
          <button
            type="button"
            onClick={addPregunta}
            disabled={preguntas.length >= GLOBOS_MAX_PREGUNTAS}
            className="rounded bg-[#2563EB] px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {preguntas.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removePregunta(p.id)}
                  disabled={preguntas.length <= GLOBOS_MIN_PREGUNTAS}
                  className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={p.enunciado ?? ''}
                onChange={(e) => updatePregunta(p.id, { enunciado: e.target.value })}
                placeholder="Enunciado"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-medium text-gray-500">
                  Globos ({p.opciones.length})
                </span>
                <button
                  type="button"
                  onClick={() => addOpcion(p.id)}
                  disabled={p.opciones.length >= GLOBOS_MAX_OPCIONES}
                  className="text-[11px] text-[#2563EB] disabled:opacity-40"
                >
                  + Globo
                </button>
              </div>

              {p.opciones.map((op, oi) => (
                <div key={oi} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name={`globos-correcta-${p.id}`}
                    checked={op.correcta === true}
                    onChange={() =>
                      updatePregunta(p.id, {
                        opciones: p.opciones.map((o, i) => ({ ...o, correcta: i === oi })),
                      })
                    }
                  />
                  <input
                    type="text"
                    value={op.texto ?? ''}
                    onChange={(e) =>
                      updatePregunta(p.id, {
                        opciones: p.opciones.map((o, i) =>
                          i === oi ? { ...o, texto: e.target.value } : o,
                        ),
                      })
                    }
                    className={`flex-1 rounded border px-2 py-0.5 text-xs ${
                      (op.texto ?? '').trim().length === 0
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-300'
                    }`}
                    placeholder={op.correcta ? 'Respuesta correcta' : `Distractor ${oi + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOpcion(p.id, oi)}
                    disabled={p.opciones.length <= GLOBOS_MIN_OPCIONES}
                    className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
