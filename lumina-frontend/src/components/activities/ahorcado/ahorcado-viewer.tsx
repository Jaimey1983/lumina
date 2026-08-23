'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AhorcadoActivity } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import {
  TECLADO_AHORCADO,
  ahorcadoFingerprint,
  crearEstadoInicialAhorcado,
  normalizarAhorcado,
  procesarLetra,
  revelarPalabraAhorcado,
} from './ahorcado-config'
import { AhorcadoFigure, partesMuñecoAhorcado } from './ahorcado-figure'
import styles from './ahorcado.module.css'

interface AhorcadoViewerProps {
  actividad: AhorcadoActivity
  editorSyncKey?: string
  onComplete?: (response: unknown) => void
}

export function AhorcadoViewer({
  actividad,
  editorSyncKey = '',
  onComplete,
}: AhorcadoViewerProps) {
  const fingerprint = ahorcadoFingerprint(actividad)
  const { configuracion } = useMemo(() => normalizarAhorcado(actividad), [fingerprint])
  const { palabra, pista, categoria, maxIntentos } = configuracion

  const [estado, setEstado] = useState(() => crearEstadoInicialAhorcado(maxIntentos))
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setEstado(crearEstadoInicialAhorcado(maxIntentos))
    setMostrarResultado(false)
    setEvaluation(null)
    completedRef.current = false
  }, [fingerprint, editorSyncKey, maxIntentos])

  useEffect(() => {
    if (!estado.completado || completedRef.current) return
    completedRef.current = true
    const raw = {
      letrasAdivinadas: estado.letrasAdivinadas,
      letrasFalladas: estado.letrasFalladas,
    }
    const evaluated = evaluateActivityResponse('ahorcado', actividad, raw)
    setEvaluation(evaluated)
    onCompleteRef.current?.(raw)
    const timer = window.setTimeout(() => setMostrarResultado(true), 350)
    return () => window.clearTimeout(timer)
  }, [estado, configuracion, actividad])

  const handleLetra = useCallback(
    (letra: string) => {
      setEstado((prev) => procesarLetra(prev, configuracion, letra))
    },
    [configuracion],
  )

  const handleReintentar = useCallback(() => {
    setEstado(crearEstadoInicialAhorcado(maxIntentos))
    setMostrarResultado(false)
    setEvaluation(null)
    completedRef.current = false
  }, [maxIntentos])

  const slots = revelarPalabraAhorcado(
    palabra,
    estado.letrasAdivinadas,
    estado.ganado === false,
  )
  const intentosUsados = estado.letrasFalladas.length
  const progresoIntentos = Math.max(0, (estado.intentosRestantes / maxIntentos) * 100)
  const partesMuñeco = partesMuñecoAhorcado(intentosUsados, maxIntentos)
  const figureEstado =
    estado.ganado === true ? 'ganado' : estado.ganado === false ? 'perdido' : 'jugando'
  const munecoWrapClass =
    figureEstado === 'perdido'
      ? `${styles.munecoWrap} ${styles.munecoWrapPerdido}`
      : figureEstado === 'ganado'
        ? `${styles.munecoWrap} ${styles.munecoWrapGanado}`
        : styles.munecoWrap

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        {categoria ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
            {categoria}
          </span>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ahorcado
          </span>
        )}
        <span className="text-xs font-medium tabular-nums text-gray-600">
          {estado.intentosRestantes}/{maxIntentos} intentos
        </span>
      </div>

      {pista ? (
        <div className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          {pista}
        </div>
      ) : null}

      <div className="shrink-0 space-y-1.5">
        <div className={styles.barraIntentos} aria-hidden>
          <div className={styles.barraIntentosFill} style={{ width: `${progresoIntentos}%` }} />
        </div>
        {estado.letrasFalladas.length > 0 ? (
          <p className="text-[11px] text-gray-500">
            Letras incorrectas: {estado.letrasFalladas.join(', ')}
          </p>
        ) : null}
      </div>

      <div className={styles.juegoLayout}>
        <div className={munecoWrapClass} aria-hidden>
          <AhorcadoFigure
            partes={partesMuñeco}
            estado={figureEstado}
            aria-label={`Ahorcado: ${partesMuñeco} de 6 partes dibujadas`}
          />
        </div>

        <div className={styles.juegoPrincipal}>
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

          {estado.ganado === false ? (
            <p className="text-center text-sm font-semibold text-red-600">
              La palabra era: <span className="tracking-wider">{palabra}</span>
            </p>
          ) : null}

          <div className={styles.tecladoWrap}>
            <div className={styles.tecladoGrid}>
              {TECLADO_AHORCADO.map((letra) => {
                const acertada = estado.letrasAdivinadas.includes(letra)
                const fallada = estado.letrasFalladas.includes(letra)
                const usada = acertada || fallada

                return (
                  <button
                    key={letra}
                    type="button"
                    disabled={estado.completado || usada}
                    onClick={() => handleLetra(letra)}
                    className={`${styles.tecla} ${acertada ? styles.teclaCorrecta : ''} ${fallada ? styles.teclaIncorrecta : ''}`}
                  >
                    {letra}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {mostrarResultado ? (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          onReintentar={handleReintentar}
          mostrarReintentar
        />
      ) : null}
    </div>
  )
}
