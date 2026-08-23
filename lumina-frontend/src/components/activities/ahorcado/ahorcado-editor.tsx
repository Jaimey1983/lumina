'use client'

import React, { useMemo } from 'react'
import { AhorcadoActivity } from '@/types/slide.types'
import { ahorcadoFingerprint, normalizarAhorcado, revelarPalabraAhorcado } from './ahorcado-config'
import { AhorcadoFigure } from './ahorcado-figure'
import styles from './ahorcado.module.css'

interface AhorcadoEditorProps {
  actividad: AhorcadoActivity
  isSelected?: boolean
}

export function AhorcadoEditor({ actividad }: AhorcadoEditorProps) {
  const fingerprint = ahorcadoFingerprint(actividad)
  const { configuracion } = useMemo(() => normalizarAhorcado(actividad), [fingerprint])
  const { palabra, pista, categoria, maxIntentos } = configuracion
  const slots = revelarPalabraAhorcado(palabra, [])

  return (
    <div className="flex h-full min-h-0 w-full select-none flex-col gap-3 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Ahorcado
        </span>
        <span className="text-xs text-gray-400">{maxIntentos} intentos</span>
      </div>

      {categoria ? (
        <span className="shrink-0 self-start rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
          {categoria}
        </span>
      ) : null}

      {pista ? (
        <p className="shrink-0 rounded-lg bg-gray-50 px-2 py-1.5 text-xs italic text-gray-600">
          {pista}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 overflow-hidden">
        <div className={styles.munecoWrap} aria-hidden>
          <AhorcadoFigure partes={0} estado="jugando" />
        </div>

        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className={styles.palabraWrap}>
            {slots.map((slot, index) =>
              slot === ' ' ? (
                <span key={`space-${index}`} className={styles.huecoEspacio} />
              ) : (
                <span key={`slot-${index}`} className={styles.huecoLetra}>
                  {slot}
                </span>
              ),
            )}
          </div>

          <p className="text-center text-[11px] text-gray-400">
            Vista previa · {palabra.replace(/\s/g, '').length} letras
          </p>
        </div>
      </div>
    </div>
  )
}
