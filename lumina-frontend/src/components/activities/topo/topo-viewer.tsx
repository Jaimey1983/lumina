'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { TopoActivity } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring'
import { ActivityTimer } from '../shared/activity-timer'
import { ActivityLives } from '../shared/activity-lives'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import {
  TIEMPO_VISIBLE_MS,
  mezclarIndicesTopo,
  normalizarTopo,
  tamanoTextoTopo,
  topoFingerprint,
} from './topo-config'
import { TOPO_GAP_PX, useTopoCellSize } from './topo-shared'
import styles from './topo.module.css'

interface TopoState {
  huecoIdx: number
  texto: string
  correcta: boolean
  visible: boolean
  golpeado: boolean
}

interface TopoViewerProps {
  actividad: TopoActivity
  onComplete?: (response: unknown) => void
}

export function TopoViewer({ actividad, onComplete }: TopoViewerProps) {
  const fingerprint = topoFingerprint(actividad)
  const { configuracion, preguntas } = useMemo(
    () => normalizarTopo(actividad),
    [fingerprint],
  )
  const { filas, columnas } = configuracion
  const totalHuecos = filas * columnas
  const tiempoVisible = TIEMPO_VISIBLE_MS[configuracion.velocidad]

  const [indicePregunta, setIndicePregunta] = useState(0)
  const [topos, setTopos] = useState<TopoState[]>([])
  const [vidas, setVidas] = useState(configuracion.vidas)
  const [segundos, setSegundos] = useState(configuracion.tiempoLimite)
  const [puntaje, setPuntaje] = useState(0)
  const [terminado, setTerminado] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const timeoutRefs = useRef<number[]>([])
  const gridAreaRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)
  const terminadoRef = useRef(false)
  const lanzarToposRef = useRef<(idx: number) => void>(() => {})

  const cellSize = useTopoCellSize(gridAreaRef, filas, columnas)
  const labelSize = tamanoTextoTopo(cellSize || 48, 'Ejemplo')

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
  }, [])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setIndicePregunta(0)
    setTopos([])
    setVidas(configuracion.vidas)
    setSegundos(configuracion.tiempoLimite)
    setPuntaje(0)
    setTerminado(false)
    setMostrarResultado(false)
    setEvaluation(null)
    completedRef.current = false
    terminadoRef.current = false
    clearTimeouts()
  }, [fingerprint, configuracion.vidas, configuracion.tiempoLimite, clearTimeouts])

  const finalizarJuego = useCallback(() => {
    if (terminadoRef.current) return
    terminadoRef.current = true
    setTerminado(true)
    clearTimeouts()
  }, [clearTimeouts])

  const lanzarTopos = useCallback(
    (idx: number) => {
      if (idx >= preguntas.length || terminadoRef.current) return
      const pregunta = preguntas[idx]
      const opciones = pregunta.opciones.filter((op) => op.texto.trim().length > 0)
      if (opciones.length === 0) return

      const huecos = mezclarIndicesTopo(totalHuecos).slice(
        0,
        Math.min(opciones.length, totalHuecos),
      )

      const nuevosTopos: TopoState[] = opciones.map((op, i) => ({
        huecoIdx: huecos[i] ?? i % totalHuecos,
        texto: op.texto,
        correcta: op.correcta,
        visible: true,
        golpeado: false,
      }))

      setTopos(nuevosTopos)

      const t = window.setTimeout(() => {
        let escapedCount = 0
        setTopos((prev) => {
          escapedCount = prev.filter((item) => item.visible && !item.golpeado).length
          return prev.map((item) => ({ ...item, visible: false }))
        })

        if (escapedCount > 0) {
          setVidas((v) => {
            const nuevas = v - 1
            if (nuevas <= 0) finalizarJuego()
            return Math.max(0, nuevas)
          })
        }

        const nextIdx = idx + 1
        if (nextIdx >= preguntas.length) {
          finalizarJuego()
        } else {
          const t2 = window.setTimeout(() => {
            setIndicePregunta(nextIdx)
            lanzarToposRef.current(nextIdx)
          }, 400)
          timeoutRefs.current.push(t2)
        }
      }, tiempoVisible)

      timeoutRefs.current.push(t)
    },
    [preguntas, totalHuecos, tiempoVisible, finalizarJuego],
  )

  useEffect(() => {
    lanzarToposRef.current = lanzarTopos
  }, [lanzarTopos])

  useEffect(() => {
    lanzarTopos(0)
    return clearTimeouts
  }, [fingerprint, lanzarTopos, clearTimeouts])

  useEffect(() => {
    if (terminado) return
    const interval = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          finalizarJuego()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [terminado, finalizarJuego])

  useEffect(() => {
    if (!terminado || completedRef.current) return
    completedRef.current = true
    const raw = {
      puntosObtenidos: puntaje,
      puntosMaximos: Math.max(preguntas.length, 1),
    }
    const evaluated = evaluateActivityResponse('topo', actividad, raw)
    setEvaluation(evaluated)
    onCompleteRef.current?.(raw)
    const timer = window.setTimeout(() => setMostrarResultado(true), 400)
    return () => window.clearTimeout(timer)
  }, [terminado, puntaje, preguntas.length, actividad])

  const handleGolpe = useCallback(
    (idx: number) => {
      const topo = topos[idx]
      if (!topo?.visible || topo.golpeado || terminadoRef.current) return

      setTopos((prev) =>
        prev.map((item, i) =>
          i === idx ? { ...item, golpeado: true, visible: false } : item,
        ),
      )

      if (topo.correcta) {
        setPuntaje((p) => p + 1)
        clearTimeouts()
        const nextIdx = indicePregunta + 1
        if (nextIdx >= preguntas.length) {
          window.setTimeout(finalizarJuego, 400)
        } else {
          const timer = window.setTimeout(() => {
            setIndicePregunta(nextIdx)
            lanzarTopos(nextIdx)
          }, 400)
          timeoutRefs.current.push(timer)
        }
      } else {
        setVidas((v) => {
          const nuevas = v - 1
          if (nuevas <= 0) finalizarJuego()
          return Math.max(0, nuevas)
        })
      }
    },
    [topos, indicePregunta, preguntas.length, finalizarJuego, lanzarTopos, clearTimeouts],
  )

  const preguntaActual = preguntas[indicePregunta]

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between">
        <ActivityLives vidas={vidas} maxVidas={configuracion.vidas} />
        <span className="text-base font-bold tabular-nums text-gray-700">
          {puntaje}/{preguntas.length}
        </span>
        <ActivityTimer segundos={segundos} />
      </div>

      {preguntaActual && (
        <div className="shrink-0 rounded-lg bg-gray-50 px-3 py-2 text-center text-base font-semibold text-gray-800">
          {preguntaActual.enunciado}
        </div>
      )}

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
              gap: TOPO_GAP_PX,
            }}
          >
            {Array.from({ length: totalHuecos }, (_, huecoIdx) => {
              const topo = topos.find((item) => item.huecoIdx === huecoIdx)
              const visible = topo?.visible ?? false

              return (
                <button
                  key={huecoIdx}
                  type="button"
                  disabled={!visible}
                  onClick={() => {
                    const topoIdx = topos.findIndex((item) => item.huecoIdx === huecoIdx)
                    if (topoIdx !== -1) handleGolpe(topoIdx)
                  }}
                  className={`${styles.hueco} ${visible ? styles.huecoActivo : styles.huecoVacio}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    color: '#fff',
                    fontSize: visible && topo?.texto
                      ? tamanoTextoTopo(cellSize, topo.texto)
                      : labelSize,
                  }}
                >
                  {visible ? (
                    <span className="px-1 text-center leading-snug break-words">{topo?.texto}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          mostrarReintentar={false}
        />
      )}
    </div>
  )
}
