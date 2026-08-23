'use client'

import React, { useMemo } from 'react'
import { GlobosActivity } from '@/types/slide.types'
import { globosFingerprint, mezclarOpcionesGlobos, normalizarGlobos } from './globos-config'
import styles from './globos.module.css'

interface GlobosEditorProps {
  actividad: GlobosActivity
  isSelected?: boolean
}

export function GlobosEditor({ actividad }: GlobosEditorProps) {
  const fingerprint = globosFingerprint(actividad)
  const { configuracion, preguntas } = useMemo(
    () => normalizarGlobos(actividad),
    [fingerprint],
  )
  const colores = configuracion.colorGlobos
  const opcionesPreview = useMemo(
    () => mezclarOpcionesGlobos(preguntas[0]?.opciones ?? []),
    [fingerprint],
  )
  const previewWidth = Math.max(72, Math.min(96, Math.floor(320 / Math.max(opcionesPreview.length, 1))))

  return (
    <div className="flex h-full min-h-0 w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Globos</span>
        <span className="text-xs text-gray-400">
          {preguntas.length} preguntas · {configuracion.vidas} vidas
        </span>
      </div>

      <p className="shrink-0 px-1 text-[11px] leading-snug text-gray-400">
        El estudiante explotará el globo con la respuesta correcta antes de que se escape.
      </p>

      <div className="relative min-h-0 flex-1">
        {opcionesPreview.map((op, i) => (
          <div
            key={`${op.texto}-${i}`}
            className={styles.balloon}
            style={{
              width: previewWidth,
              height: Math.round(previewWidth * 1.18),
              backgroundColor: colores[i % colores.length],
              left: `${8 + (84 / Math.max(opcionesPreview.length - 1, 1)) * i}%`,
              bottom: `${12 + (i % 3) * 16}%`,
              fontSize: Math.max(10, Math.floor(previewWidth * 0.14)),
              pointerEvents: 'none',
            }}
          >
            {op.texto}
          </div>
        ))}
      </div>

      {preguntas[0] && (
        <div className="shrink-0 truncate rounded-lg bg-gray-50 px-2 py-1 text-center text-xs text-gray-600">
          {preguntas[0].enunciado}
        </div>
      )}
    </div>
  )
}
