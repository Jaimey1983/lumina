'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { GlobosActivity } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'
import { ActivityTimer } from '../shared/activity-timer'
import { ActivityLives } from '../shared/activity-lives'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import {
  VELOCIDAD_PX,
  globosFingerprint,
  mezclarOpcionesGlobos,
  normalizarGlobos,
} from './globos-config'
import { useGloboMetrics } from './globos-shared'
import styles from './globos.module.css'

interface GloboState {
  id: string
  texto: string
  correcta: boolean
  x: number
  y: number
  color: string
  explotando: boolean
  velocidad: number
}

interface GlobosViewerProps {
  actividad: GlobosActivity
  onComplete?: (response: unknown) => void
}

function calcularPosicionesGlobos(count: number): number[] {
  if (count <= 1) return [50]
  const margin = 8
  const span = 100 - margin * 2
  return Array.from({ length: count }, (_, index) => margin + (span / (count - 1)) * index)
}

export function GlobosViewer({ actividad, onComplete }: GlobosViewerProps) {
  const fingerprint = globosFingerprint(actividad)
  const { configuracion, preguntas } = useMemo(
    () => normalizarGlobos(actividad),
    [fingerprint],
  )
  const velBase = VELOCIDAD_PX[configuracion.velocidad]

  const [indicePregunta, setIndicePregunta] = useState(0)
  const [globos, setGlobos] = useState<GloboState[]>([])
  const [vidas, setVidas] = useState(configuracion.vidas)
  const [segundos, setSegundos] = useState(configuracion.tiempoLimite)
  const [puntaje, setPuntaje] = useState(0)
  const [terminado, setTerminado] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)
  const terminadoRef = useRef(false)

  const preguntaActual = preguntas[indicePregunta]
  const opcionesActuales = preguntaActual?.opciones ?? []
  const metrics = useGloboMetrics(containerRef, opcionesActuales.length)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setIndicePregunta(0)
    setGlobos([])
    setVidas(configuracion.vidas)
    setSegundos(configuracion.tiempoLimite)
    setPuntaje(0)
    setTerminado(false)
    setMostrarResultado(false)
    setEvaluation(null)
    completedRef.current = false
    terminadoRef.current = false
    lastTimeRef.current = 0
  }, [fingerprint, configuracion.vidas, configuracion.tiempoLimite])

  const finalizarJuego = useCallback(() => {
    if (terminadoRef.current) return
    terminadoRef.current = true
    setTerminado(true)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }, [])

  const lanzarGlobos = useCallback(
    (idx: number) => {
      if (idx >= preguntas.length) return
      const pregunta = preguntas[idx]
      const opciones = pregunta.opciones.filter((op) => op.texto.trim().length > 0)
      if (opciones.length === 0) return

      const colores = configuracion.colorGlobos
      const posiciones = calcularPosicionesGlobos(opciones.length)
      const opcionesMezcladas = mezclarOpcionesGlobos(opciones)

      const nuevosGlobos: GloboState[] = opcionesMezcladas.map((op, i) => ({
        id: `glob-${idx}-${i}-${op.texto}`,
        texto: op.texto,
        correcta: op.correcta,
        x: posiciones[i] + (Math.random() - 0.5) * 4,
        y: 108 + (i % 3) * 8 + Math.random() * 6,
        color: colores[i % colores.length],
        explotando: false,
        velocidad: velBase * (0.85 + Math.random() * 0.3),
      }))

      setGlobos(nuevosGlobos)
    },
    [preguntas, configuracion.colorGlobos, velBase],
  )

  useEffect(() => {
    lanzarGlobos(0)
  }, [fingerprint, lanzarGlobos])

  useEffect(() => {
    if (terminado) return

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const containerH = containerRef.current?.clientHeight ?? 400
      let escapedCount = 0

      setGlobos((prev) => {
        const actualizados = prev.map((g) => {
          if (g.explotando) return g
          const dyPct = ((g.velocidad * dt) / containerH) * 100
          return { ...g, y: g.y - dyPct }
        })

        escapedCount = actualizados.filter((g) => g.y < -18 && !g.explotando).length
        if (escapedCount > 0) {
          return actualizados.filter((g) => g.y >= -18 || g.explotando)
        }
        return actualizados
      })

      if (escapedCount > 0) {
        setVidas((v) => {
          const nuevas = v - escapedCount
          if (nuevas <= 0) finalizarJuego()
          return Math.max(0, nuevas)
        })
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [terminado, finalizarJuego])

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
    const evaluated = evaluateActivityResponse('globos', actividad, raw)
    setEvaluation(evaluated)
    onCompleteRef.current?.(raw)
    const timer = window.setTimeout(() => setMostrarResultado(true), 400)
    return () => window.clearTimeout(timer)
  }, [terminado, puntaje, preguntas.length, actividad])

  const handleClickGlobo = useCallback(
    (globoId: string, correcta: boolean) => {
      if (terminadoRef.current) return

      setGlobos((prev) =>
        prev.map((g) => (g.id === globoId ? { ...g, explotando: true } : g)),
      )

      window.setTimeout(() => {
        setGlobos((prev) => prev.filter((g) => g.id !== globoId))
      }, 320)

      if (correcta) {
        setPuntaje((p) => p + 1)
      } else {
        setVidas((v) => {
          const nuevas = v - 1
          if (nuevas <= 0) finalizarJuego()
          return Math.max(0, nuevas)
        })
      }

      const nextIdx = indicePregunta + 1
      window.setTimeout(() => {
        if (nextIdx >= preguntas.length) {
          finalizarJuego()
        } else {
          setIndicePregunta(nextIdx)
          lanzarGlobos(nextIdx)
        }
      }, 450)
    },
    [indicePregunta, preguntas.length, finalizarJuego, lanzarGlobos],
  )

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3"
      ref={containerRef}
    >
      <div className="z-10 flex shrink-0 items-center justify-between">
        <ActivityLives vidas={vidas} maxVidas={configuracion.vidas} />
        <span className="text-xs font-semibold text-gray-600">
          {puntaje}/{preguntas.length}
        </span>
        <ActivityTimer segundos={segundos} />
      </div>

      {preguntaActual && (
        <div className="z-10 shrink-0 rounded-lg bg-white/90 px-3 py-2 text-center text-sm font-medium text-gray-700 shadow-sm">
          {preguntaActual.enunciado}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {globos.map((globo) => (
          <button
            key={globo.id}
            type="button"
            onClick={() => handleClickGlobo(globo.id, globo.correcta)}
            className={`${styles.balloon} ${globo.explotando ? styles.balloonExploding : ''}`}
            style={{
              width: metrics.width,
              height: metrics.height,
              backgroundColor: globo.color,
              left: `${globo.x}%`,
              bottom: `${globo.y}%`,
              fontSize: metrics.fontSize,
              visibility: globo.explotando ? 'visible' : 'visible',
              pointerEvents: globo.explotando ? 'none' : 'auto',
            }}
          >
            {globo.texto}
          </button>
        ))}
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
