'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { AbrirCajaActivity } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import {
  abrirCajaFingerprint,
  duracionTotalAperturaAbrirCaja,
  ABRIR_CAJA_DURACION_CIERRE_MS,
  esEvaluable,
  normalizarAbrirCaja,
} from './abrir-caja-config'
import styles from './abrir-caja.module.css'
import {
  ABRIR_CAJA_GAP_PX,
  CajaIcon,
  tamanoEtiquetaCaja,
  tamanoIconoCaja,
  useAbrirCajaCellSize,
} from './abrir-caja-shared'

interface CajaEstado {
  abierta: boolean
  animando: boolean
  fase?: 'cierre' | 'revelacion'
}

interface AbrirCajaViewerProps {
  actividad: AbrirCajaActivity
  onComplete?: (response: unknown) => void
}

function buildEstadosIniciales(cajas: { id: string }[]): Record<string, CajaEstado> {
  return Object.fromEntries(cajas.map((c) => [c.id, { abierta: false, animando: false }]))
}

function getAnimClass(
  animacion: 'flip' | 'zoom' | 'fade',
  fase: CajaEstado['fase'],
): string | undefined {
  if (fase === 'cierre') return styles.animCierre
  if (fase !== 'revelacion') return undefined
  switch (animacion) {
    case 'flip':
      return styles.animFlip
    case 'zoom':
      return styles.animZoom
    case 'fade':
      return styles.animFade
    default:
      return undefined
  }
}

export function AbrirCajaViewer({ actividad, onComplete }: AbrirCajaViewerProps) {
  const fingerprint = abrirCajaFingerprint(actividad)
  const { configuracion, cajas } = useMemo(
    () => normalizarAbrirCaja(actividad),
    [fingerprint],
  )
  const { filas, columnas, colorCaja, animacionApertura } = configuracion
  const gridAreaRef = useRef<HTMLDivElement>(null)
  const cellSize = useAbrirCajaCellSize(gridAreaRef, filas, columnas)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)

  const [estados, setEstados] = useState<Record<string, CajaEstado>>(() =>
    buildEstadosIniciales(cajas),
  )
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)
  const evaluable = esEvaluable(cajas)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setEstados(buildEstadosIniciales(cajas))
    setMostrarResultado(false)
    setEvaluation(null)
    completedRef.current = false
  }, [fingerprint])

  const abiertasCount = useMemo(
    () => cajas.filter((c) => estados[c.id]?.abierta).length,
    [cajas, estados],
  )

  useEffect(() => {
    if (cajas.length === 0 || completedRef.current) return
    if (abiertasCount < cajas.length) return

    completedRef.current = true
    const cajasAbiertas = cajas.filter((c) => estados[c.id]?.abierta).map((c) => c.id)
    const raw = { cajasAbiertas }
    const evaluated = evaluateActivityResponse('abrir_caja', actividad, raw)
    setEvaluation(evaluated)
    onCompleteRef.current?.(raw)
    if (evaluated.score !== null) {
      setMostrarResultado(true)
    }
  }, [fingerprint, abiertasCount, cajas, estados, actividad])

  const handleClickCaja = useCallback((id: string) => {
    setEstados((prev) => {
      if (prev[id]?.abierta || prev[id]?.animando) return prev

      if (animacionApertura === 'flip') {
        return { ...prev, [id]: { abierta: false, animando: true, fase: 'cierre' } }
      }

      return { ...prev, [id]: { abierta: true, animando: true, fase: 'revelacion' } }
    })

    if (animacionApertura === 'flip') {
      window.setTimeout(() => {
        setEstados((prev) => {
          const current = prev[id]
          if (!current?.animando || current.fase !== 'cierre') return prev
          return { ...prev, [id]: { abierta: true, animando: true, fase: 'revelacion' } }
        })
      }, ABRIR_CAJA_DURACION_CIERRE_MS)
    }

    window.setTimeout(() => {
      setEstados((prev) => {
        const current = prev[id]
        if (!current?.animando) return prev
        return { ...prev, [id]: { abierta: true, animando: false } }
      })
    }, duracionTotalAperturaAbrirCaja(animacionApertura))
  }, [animacionApertura])

  const cajasAbiertasIds = cajas.filter((c) => estados[c.id]?.abierta).map((c) => c.id)

  const correctasAbiertas = cajasAbiertasIds.filter((id) => {
    const caja = cajas.find((c) => c.id === id)
    return caja?.contenido.esCorrecta === true
  }).length

  const totalCorrectas = cajas.filter((c) => c.contenido.esCorrecta === true).length
  const totalSlots = filas * columnas
  const iconSize = tamanoIconoCaja(cellSize || 48)
  const labelSize = tamanoEtiquetaCaja(cellSize || 48)

  if (cajas.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
        Sin cajas configuradas
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3">
      <p className="shrink-0 text-center text-xs text-gray-500">
        Toca cada caja para abrirla y descubrir su contenido
      </p>

      <div
        ref={gridAreaRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        {cellSize > 0 && (
          <div
            className="grid shrink-0"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: ABRIR_CAJA_GAP_PX,
            }}
          >
            {Array.from({ length: totalSlots }, (_, index) => {
              const caja = cajas[index]
              if (!caja) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{ width: cellSize, height: cellSize }}
                    aria-hidden
                  />
                )
              }

              const estado = estados[caja.id] ?? { abierta: false, animando: false }
              const { abierta, animando, fase } = estado
              const esCorrecta = caja.contenido.esCorrecta
              const showClosed = !abierta || fase === 'cierre'
              const showOpen = abierta && fase !== 'cierre'
              const animClass = animando ? getAnimClass(animacionApertura, fase) : undefined
              const borderColor =
                abierta && !animando && evaluable && esCorrecta !== undefined
                  ? esCorrecta
                    ? '#16A34A'
                    : '#DC2626'
                  : 'transparent'

              return (
                <button
                  key={caja.id}
                  type="button"
                  onClick={() => handleClickCaja(caja.id)}
                  disabled={animando || abierta}
                  className={`${styles.cajaButton} relative overflow-hidden rounded-xl border-2 p-2 shadow-sm`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: showOpen ? '#F9FAFB' : colorCaja,
                    borderColor,
                    cursor: animando || abierta ? 'default' : 'pointer',
                  }}
                >
                  {showClosed ? (
                    <div
                      className={`${styles.cajaFace} ${fase === 'cierre' ? styles.animCierre : ''}`}
                    >
                      <CajaIcon size={iconSize} className="text-white opacity-90" />
                      <span
                        className="w-full truncate text-center font-semibold leading-tight text-white"
                        style={{ fontSize: labelSize }}
                      >
                        {caja.etiqueta}
                      </span>
                    </div>
                  ) : null}
                  {showOpen ? (
                    <div
                      className={`${styles.cajaFace} ${styles.cajaFaceOpen} ${animClass ?? ''}`}
                    >
                      {evaluable && esCorrecta !== undefined && (
                        <span style={{ fontSize: Math.max(14, labelSize + 2) }}>
                          {esCorrecta ? '✅' : '❌'}
                        </span>
                      )}
                      {caja.contenido.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={caja.contenido.imagen}
                          alt=""
                          className="max-h-[45%] max-w-full rounded object-contain"
                        />
                      )}
                      {caja.contenido.texto && (
                        <span
                          className="text-center font-medium leading-tight text-gray-700"
                          style={{ fontSize: labelSize }}
                        >
                          {caja.contenido.texto}
                        </span>
                      )}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 text-center text-xs text-gray-400">
        {cajasAbiertasIds.length} de {cajas.length} cajas abiertas
        {evaluable && totalCorrectas > 0 && cajasAbiertasIds.length > 0
          ? ` · ${correctasAbiertas} correctas`
          : ''}
      </div>

      {mostrarResultado && evaluable && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          mostrarReintentar={false}
        />
      )}
    </div>
  )
}
