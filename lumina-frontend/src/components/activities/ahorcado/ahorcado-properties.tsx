'use client'

import React, { useCallback, useMemo } from 'react'
import { AhorcadoActivity } from '@/types/slide.types'
import {
  AHORCADO_MAX_INTENTOS,
  AHORCADO_MIN_INTENTOS,
  esPalabraAhorcadoValida,
  normalizarAhorcado,
  normalizarPalabraAhorcado,
} from './ahorcado-config'

interface AhorcadoPropertiesProps {
  actividad: AhorcadoActivity
  onChange: (actividad: AhorcadoActivity) => void
}

export function AhorcadoProperties({ actividad, onChange }: AhorcadoPropertiesProps) {
  const { configuracion } = useMemo(
    () => normalizarAhorcado(actividad),
    [actividad],
  )

  const updateConfig = useCallback(
    (partial: Partial<typeof configuracion>) => {
      onChange({
        ...actividad,
        tipo: 'ahorcado',
        configuracion: { ...configuracion, ...partial },
      })
    },
    [actividad, configuracion, onChange],
  )

  const palabraInvalida = !esPalabraAhorcadoValida(configuracion.palabra)

  return (
    <div className="space-y-4 p-3 text-sm">
      <section className="rounded border border-gray-200 bg-gray-50 p-3">
        <h4 className="mb-3 font-semibold text-gray-800">Configuración</h4>
        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-700">Palabra secreta</span>
            <input
              type="text"
              value={configuracion.palabra}
              onChange={(e) =>
                updateConfig({ palabra: normalizarPalabraAhorcado(e.target.value) })
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs uppercase"
              placeholder="EJEMPLO"
            />
            {palabraInvalida ? (
              <span className="text-[11px] text-red-500">
                Ingresa al menos una letra (A-Z, Ñ; espacios permitidos).
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                Se guarda en mayúsculas, sin tildes.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-700">Pista (opcional)</span>
            <textarea
              value={configuracion.pista ?? ''}
              onChange={(e) => updateConfig({ pista: e.target.value })}
              rows={2}
              className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-xs"
              placeholder="Ej: Animal que vuela de noche"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-700">Categoría (opcional)</span>
            <input
              type="text"
              value={configuracion.categoria ?? ''}
              onChange={(e) => updateConfig({ categoria: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              placeholder="Ej: Ciencias Naturales"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-700">
              Intentos fallidos permitidos ({AHORCADO_MIN_INTENTOS}–{AHORCADO_MAX_INTENTOS})
            </span>
            <input
              type="number"
              min={AHORCADO_MIN_INTENTOS}
              max={AHORCADO_MAX_INTENTOS}
              value={configuracion.maxIntentos}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (!Number.isFinite(value)) return
                updateConfig({
                  maxIntentos: Math.min(
                    AHORCADO_MAX_INTENTOS,
                    Math.max(AHORCADO_MIN_INTENTOS, value),
                  ),
                })
              }}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
            />
          </label>
        </div>
      </section>
    </div>
  )
}
