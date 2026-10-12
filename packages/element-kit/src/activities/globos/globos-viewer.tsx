'use client'

/**
 * Viewer de Globos sobre el `ActivityShell` (U9d.1).
 *
 * El shell aporta el reloj, las vidas, el progreso y la pantalla de resultados; aquí queda solo el
 * juego (globos que suben, pinchar, avanzar de pregunta). Lo que sale hacia `@lumina/scoring` NO
 * cambió: UNA respuesta `{ puntosObtenidos, puntosMaximos }` al terminar (por completar, por
 * quedarse sin vidas o por agotar el tiempo); sale por `onResponse` (canal unificado, DU2) y
 *
 *
 * Vidas y tiempo siguen viniendo de `configuracion.vidas` / `configuracion.tiempoLimite`
 * (`normalizarAjustes` los deriva). Un globo que se escapa por arriba cuesta una vida.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GlobosActivity } from '@lumina/types/slide'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { useActivityFeedback } from '../_shared/activity-feedback.js'
import { normalizarAjustes } from '../_shared/activity-settings.js'
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js'
import { VELOCIDAD_PX, globosFingerprint, mezclarOpcionesGlobos, normalizarGlobos } from './globos-config.js'
import { useGloboMetrics } from './globos-shared.js'
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

export interface GlobosViewerProps {
  actividad: GlobosActivity
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
}

function calcularPosicionesGlobos(count: number): number[] {
  if (count <= 1) return [50]
  const margin = 8
  const span = 100 - margin * 2
  return Array.from({ length: count }, (_, index) => margin + (span / (count - 1)) * index)
}

/** Por encima de este `y` (en %) el globo ya salió por arriba. */
const LIMITE_SUPERIOR = -18
const MS_ESTALLIDO = 320
const MS_AVANCE = 450

interface CuerpoProps {
  actividad: GlobosActivity
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, preguntas } = actividad
  const velBase = VELOCIDAD_PX[configuracion.velocidad]
  const jugando = ctx.sesion.fase === 'jugando'
  const motivoFin = ctx.sesion.motivoFin
  const { setProgreso, completar, perderVida } = ctx
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })

  const [indicePregunta, setIndicePregunta] = useState(0)
  const [globos, setGlobos] = useState<GloboState[]>([])
  const [puntaje, setPuntaje] = useState(0)
  const [anuncio, setAnuncio] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const globosRef = useRef<GloboState[]>([])
  const jugandoRef = useRef(jugando)
  const respondidaRef = useRef(false)
  const emitidaRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const temporizadores = useRef<number[]>([])
  const perderVidaRef = useRef(perderVida)
  const completarRef = useRef(completar)

  const preguntaActual = preguntas[indicePregunta]
  const metrics = useGloboMetrics(containerRef, preguntaActual?.opciones.length ?? 0)

  useEffect(() => {
    jugandoRef.current = jugando
    perderVidaRef.current = perderVida
    completarRef.current = completar
  })

  useEffect(() => {
    setProgreso(puntaje, preguntas.length)
  }, [puntaje, preguntas.length, setProgreso])

  const poner = useCallback((lista: GloboState[]) => {
    globosRef.current = lista
    setGlobos(lista)
  }, [])

  const despues = useCallback((fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(
    () => () => {
      temporizadores.current.forEach((t) => window.clearTimeout(t))
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  const lanzarGlobos = useCallback(
    (idx: number) => {
      const pregunta = preguntas[idx]
      if (!pregunta) return
      const opciones = pregunta.opciones.filter((op) => op.texto.trim().length > 0)
      if (opciones.length === 0) return
      const colores = configuracion.colorGlobos
      const posiciones = calcularPosicionesGlobos(opciones.length)
      const mezcladas = mezclarOpcionesGlobos(opciones, ctx.ajustes.semilla, idx)
      respondidaRef.current = false
      poner(
        mezcladas.map((op, i) => ({
          id: `glob-${idx}-${i}-${op.texto}`,
          texto: op.texto,
          correcta: op.correcta,
          x: posiciones[i]! + (Math.random() * 4 - 2),
          y: 108 + (i % 3) * 8 + Math.random() * 6,
          color: colores[i % colores.length]!,
          explotando: false,
          velocidad: velBase * (0.85 + Math.random() * 0.3),
        })),
      )
    },
    [preguntas, configuracion.colorGlobos, velBase, ctx.ajustes.semilla, poner],
  )

  useEffect(() => {
    lanzarGlobos(0)
    // Solo al montar: cada contenido nuevo remonta el cuerpo (`key` de la huella).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Los globos suben; los que salen por arriba cuestan una vida cada uno.
  useEffect(() => {
    if (!jugando) return
    lastTimeRef.current = 0
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp
      const alto = containerRef.current?.clientHeight || 400
      const subidos = globosRef.current.map((g) =>
        g.explotando ? g : { ...g, y: g.y - ((g.velocidad * dt) / alto) * 100 },
      )
      const escapados = subidos.filter((g) => g.y < LIMITE_SUPERIOR && !g.explotando).length
      poner(escapados > 0 ? subidos.filter((g) => g.y >= LIMITE_SUPERIOR || g.explotando) : subidos)
      if (escapados > 0) {
        setAnuncio(escapados === 1 ? 'Se escapó un globo.' : `Se escaparon ${escapados} globos.`)
        for (let i = 0; i < escapados; i++) perderVidaRef.current()
      }
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [jugando, poner])

  // Al terminar (completar, sin vidas o sin tiempo) sale UNA respuesta con lo acertado.
  useEffect(() => {
    if (!motivoFin || emitidaRef.current) return
    emitidaRef.current = true
    const raw = { puntosObtenidos: puntaje, puntosMaximos: Math.max(preguntas.length, 1) }
    alEvaluar(evaluateActivityResponse('globos', actividad, raw))
    responder(raw)
    // Solo reacciona al fin de la partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivoFin])

  const pinchar = (globo: GloboState) => {
    // Una respuesta por pregunta: pinchar un segundo globo antes del avance no cuenta.
    if (!jugandoRef.current || respondidaRef.current || globo.explotando) return
    respondidaRef.current = true
    poner(globosRef.current.map((g) => (g.id === globo.id ? { ...g, explotando: true } : g)))
    despues(() => poner(globosRef.current.filter((g) => g.id !== globo.id)), MS_ESTALLIDO)

    if (globo.correcta) {
      setPuntaje((p) => p + 1)
      feedback.emitir('acierto', { movimiento: false })
      setAnuncio(`Correcto: ${globo.texto}.`)
    } else {
      feedback.emitir('error', { movimiento: false })
      setAnuncio(`Incorrecto: ${globo.texto}.`)
      perderVida()
    }

    const siguiente = indicePregunta + 1
    despues(() => {
      if (!jugandoRef.current) return
      if (siguiente >= preguntas.length) {
        completarRef.current()
      } else {
        setIndicePregunta(siguiente)
        lanzarGlobos(siguiente)
      }
    }, MS_AVANCE)
  }

  return (
    <div className={styles.raiz} ref={containerRef}>
      {preguntaActual && <div className={styles.pregunta}>{preguntaActual.enunciado}</div>}

      <div className={styles.cielo}>
        {globos.map((globo) => (
          <button
            key={globo.id}
            type="button"
            onClick={() => pinchar(globo)}
            className={`${styles.balloon} ${globo.explotando ? styles.balloonExploding : ''}`}
            style={{
              width: metrics.width,
              height: metrics.height,
              backgroundColor: globo.color,
              left: `${globo.x}%`,
              bottom: `${globo.y}%`,
              fontSize: metrics.fontSize,
            }}
          >
            {globo.texto}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>
    </div>
  )
}

export function GlobosViewer({ actividad, onResponse }: GlobosViewerProps) {
  const fingerprint = globosFingerprint(actividad)
  // El contenido normalizado (vidas y tiempo con su valor por defecto) alimenta también los ajustes.
  const normalizada = useMemo(
    () => normalizarGlobos(actividad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  )
  const ajustes = useMemo(() => normalizarAjustes(normalizada), [normalizada])
  // Se juega una sola vez (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes])
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const salida = useRef(onResponse)
  useEffect(() => {
    salida.current = onResponse
  }, [onResponse])
  const responder = useCallback((r: unknown) => salida.current?.(r), [])

  return (
    <ActivityShell
      key={fingerprint}
      ajustes={ajustesShell}
      total={normalizada.preguntas.length}
      evaluation={evaluation}
      className={styles.shell}
    >
      {(ctx) => <Cuerpo actividad={normalizada} ctx={ctx} responder={responder} alEvaluar={setEvaluation} />}
    </ActivityShell>
  )
}
