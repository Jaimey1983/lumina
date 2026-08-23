'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { AbrirCajaActivity, AbrirCajaCaja, AbrirCajaContenido } from '@/types/slide.types'
import {
  generarIdCaja,
  ABRIR_CAJA_MAX_CAJAS,
  ABRIR_CAJA_MIN_CAJAS,
  ABRIR_CAJA_ANIMACION_DEFAULT,
  ABRIR_CAJA_COLOR_DEFAULT,
  ABRIR_CAJA_COLUMNAS_DEFAULT,
  ABRIR_CAJA_FILAS_DEFAULT,
  normalizarAbrirCaja,
} from './abrir-caja-config'

interface AbrirCajaPropertiesProps {
  actividad: AbrirCajaActivity
  onChange: (actividad: AbrirCajaActivity) => void
}

export function AbrirCajaProperties({ actividad, onChange }: AbrirCajaPropertiesProps) {
  const actividadNorm = useMemo(() => normalizarAbrirCaja(actividad), [actividad])
  const { configuracion, cajas } = actividadNorm
  const filas = configuracion.filas ?? ABRIR_CAJA_FILAS_DEFAULT
  const columnas = configuracion.columnas ?? ABRIR_CAJA_COLUMNAS_DEFAULT
  const colorCaja = configuracion.colorCaja ?? ABRIR_CAJA_COLOR_DEFAULT
  const animacionApertura = configuracion.animacionApertura ?? ABRIR_CAJA_ANIMACION_DEFAULT

  useEffect(() => {
    const cfg = actividad.configuracion
    const hasLegacyCajas =
      Array.isArray(actividad.cajas) &&
      actividad.cajas.some((caja) => {
        const raw = caja as AbrirCajaCaja & { titulo?: string }
        return typeof raw.etiqueta !== 'string' && typeof raw.titulo === 'string'
      })
    const missingConfig =
      !cfg ||
      typeof cfg.colorCaja !== 'string' ||
      typeof cfg.filas !== 'number' ||
      typeof cfg.columnas !== 'number' ||
      typeof cfg.animacionApertura !== 'string'

    if (missingConfig || hasLegacyCajas || !Array.isArray(actividad.cajas)) {
      onChange(actividadNorm)
    }
  }, [actividad, actividadNorm, onChange])

  const update = useCallback((partial: Partial<AbrirCajaActivity>) => {
    onChange(normalizarAbrirCaja({ ...actividadNorm, ...partial }))
  }, [actividadNorm, onChange])

  const updateConfig = useCallback((partial: Partial<AbrirCajaActivity['configuracion']>) => {
    update({ configuracion: { ...configuracion, ...partial } })
  }, [configuracion, update])

  const addCaja = useCallback(() => {
    if (cajas.length >= ABRIR_CAJA_MAX_CAJAS) return
    const id = generarIdCaja('caja')
    update({
      cajas: [...cajas, {
        id,
        etiqueta: `Caja ${cajas.length + 1}`,
        contenido: { texto: '' },
      }],
    })
  }, [cajas, update])

  const removeCaja = useCallback((id: string) => {
    if (cajas.length <= ABRIR_CAJA_MIN_CAJAS) return
    update({ cajas: cajas.filter(c => c.id !== id) })
  }, [cajas, update])

  const updateCaja = useCallback((id: string, partial: Partial<AbrirCajaCaja>) => {
    update({ cajas: cajas.map(c => c.id === id ? { ...c, ...partial } : c) })
  }, [cajas, update])

  const updateContenido = useCallback((
    id: string,
    campo: keyof AbrirCajaContenido,
    valor: string | boolean | undefined,
  ) => {
    update({
      cajas: cajas.map(c =>
        c.id === id ? { ...c, contenido: { ...c.contenido, [campo]: valor } } : c
      ),
    })
  }, [cajas, update])

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">

      {/* Configuración */}
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Filas</span>
            <select
              value={filas}
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
              value={columnas}
              onChange={e => updateConfig({ columnas: Number(e.target.value) as 2 | 3 | 4 })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Color de caja</span>
            <input
              type="color"
              value={colorCaja}
              onChange={e => updateConfig({ colorCaja: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Animación de apertura</span>
            <select
              value={animacionApertura}
              onChange={e => updateConfig({ animacionApertura: e.target.value as 'flip' | 'zoom' | 'fade' })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="flip">Flip</option>
              <option value="zoom">Zoom</option>
              <option value="fade">Fade</option>
            </select>
          </label>
        </div>
      </section>

      {/* Cajas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Cajas ({cajas.length})</h4>
          <button
            onClick={addCaja}
            disabled={cajas.length >= ABRIR_CAJA_MAX_CAJAS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {cajas.map((caja, idx) => (
            <div key={caja.id} className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Caja {idx + 1}</span>
                <button
                  onClick={() => removeCaja(caja.id)}
                  disabled={cajas.length <= ABRIR_CAJA_MIN_CAJAS}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
                >
                  ✕
                </button>
              </div>
              {/* Etiqueta */}
              <input
                type="text"
                value={caja.etiqueta ?? ''}
                onChange={e => updateCaja(caja.id, { etiqueta: e.target.value })}
                placeholder="Etiqueta visible"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
              />
              {/* Contenido texto */}
              <input
                type="text"
                value={caja.contenido.texto ?? ''}
                onChange={e => updateContenido(caja.id, 'texto', e.target.value)}
                placeholder="Texto al abrir"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
              />
              {/* Evaluación — esCorrecta */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Evaluable:</span>
                <select
                  value={
                    caja.contenido.esCorrecta === undefined
                      ? 'none'
                      : caja.contenido.esCorrecta ? 'true' : 'false'
                  }
                  onChange={e => {
                    const val = e.target.value
                    updateContenido(
                      caja.id,
                      'esCorrecta',
                      val === 'none' ? undefined : val === 'true',
                    )
                  }}
                  className="rounded border border-gray-300 px-1 py-1 text-xs flex-1"
                >
                  <option value="none">Sin evaluación</option>
                  <option value="true">✅ Correcta</option>
                  <option value="false">❌ Incorrecta</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
