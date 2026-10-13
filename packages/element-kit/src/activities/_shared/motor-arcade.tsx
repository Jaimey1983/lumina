'use client'

/**
 * U10.2 — motor Arcade común de `globos` y `topo` (etapa U).
 *
 * Los dos juegos son la misma actividad con distinta mecánica: preguntas `{ enunciado, opciones }`,
 * UNA respuesta por pregunta, vidas y reloj del shell, puntaje de aciertos y UNA salida
 * `{ puntosObtenidos, puntosMaximos }` al terminar (completar, sin vidas o sin tiempo). Este
 * módulo lleva todo eso; cada juego aporta solo lo suyo (cómo se ven y se mueven las opciones) como
 * *skin* sobre `useMotorArcade`. La forma de los datos y de la respuesta NO cambia.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { useActivityFeedback } from './activity-feedback.js'
import { normalizarAjustes } from './activity-settings.js'
import { ActivityShell, type ActivityShellContext } from './activity-shell.js'

/** Lo que el motor necesita de una actividad arcade. */
export interface ActividadArcade {
  preguntas: { enunciado: string }[]
}

// ── Envoltorio: normalización, shell y canal de salida ───────────────────────────────────────────

export interface CuerpoArcadeProps<A extends ActividadArcade> {
  /** La actividad ya normalizada (vidas y tiempo con su valor por defecto). */
  actividad: A
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

interface ArcadeActividadProps<A extends ActividadArcade> {
  actividad: A
  normalizar: (a: A) => A
  /** Huella del CONTENIDO: cambiarla reinicia la partida; un ajuste visual no. */
  huella: (a: A) => string
  onResponse?: (response: unknown) => void
  className?: string
  children: (props: CuerpoArcadeProps<A>) => ReactNode
}

/** Shell del juego: se juega una sola vez (sin «Reintentar») y cada contenido nuevo remonta el cuerpo. */
export function ArcadeActividad<A extends ActividadArcade>({
  actividad,
  normalizar,
  huella,
  onResponse,
  className,
  children,
}: ArcadeActividadProps<A>) {
  const fingerprint = huella(actividad)
  // El contenido normalizado (vidas y tiempo con su valor por defecto) alimenta también los ajustes.
  const normalizada = useMemo(
    () => normalizar(actividad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  )
  const ajustes = useMemo(() => normalizarAjustes(normalizada as never), [normalizada])
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
      className={className}
    >
      {(ctx) => children({ actividad: normalizada, ctx, responder, alEvaluar: setEvaluation })}
    </ActivityShell>
  )
}

// ── Motor: puntaje, avance, vidas, salida única ───────────────────────────────────────────────────

export interface MotorArcade {
  jugando: boolean
  /** Ref de `jugando`, para callbacks diferidos. */
  jugandoRef: { readonly current: boolean }
  indicePregunta: number
  puntaje: number
  /** Texto para la región `aria-live`. */
  anuncio: string
  setAnuncio: (texto: string) => void
  /** Agenda un callback que se cancela al terminar la partida o desmontar. */
  despues: (fn: () => void, ms: number) => void
  /** Cancela todo lo agendado con `despues`. */
  limpiar: () => void
  /** `perderVida` del shell (estable, para usar dentro de callbacks). */
  perderVida: () => void
  /** Cuenta una respuesta: acierto suma, error cuesta una vida; suena y se anuncia. */
  responder: (correcta: boolean, texto: string) => void
  /**
   * Tras `espera` ms pasa a la pregunta siguiente (y llama a `lanzarRef.current`) o, si era la
   * última, completa la partida. No hace nada si ya terminó.
   */
  programarAvance: (desde: number, espera: number) => void
  /** El juego registra aquí cómo «lanzar» una pregunta (poner globos, asomar topos). */
  lanzarRef: { current: (indice: number) => void }
}

interface OpcionesMotor<A extends ActividadArcade> {
  actividad: A
  /** Clave del evaluador de `@lumina/scoring`. */
  tipo: 'globos' | 'topo'
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

export function useMotorArcade<A extends ActividadArcade>({
  actividad,
  tipo,
  ctx,
  responder: salida,
  alEvaluar,
}: OpcionesMotor<A>): MotorArcade {
  const preguntas = actividad.preguntas
  const jugando = ctx.sesion.fase === 'jugando'
  const motivoFin = ctx.sesion.motivoFin
  const { setProgreso, completar, perderVida } = ctx
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })

  const [indicePregunta, setIndicePregunta] = useState(0)
  const [puntaje, setPuntaje] = useState(0)
  const [anuncio, setAnuncio] = useState('')

  const jugandoRef = useRef(jugando)
  const emitidaRef = useRef(false)
  const temporizadores = useRef<number[]>([])
  const perderVidaRef = useRef(perderVida)
  const completarRef = useRef(completar)
  const lanzarRef = useRef<(indice: number) => void>(() => {})

  useEffect(() => {
    jugandoRef.current = jugando
    perderVidaRef.current = perderVida
    completarRef.current = completar
  })

  useEffect(() => {
    setProgreso(puntaje, preguntas.length)
  }, [puntaje, preguntas.length, setProgreso])

  const limpiar = useCallback(() => {
    temporizadores.current.forEach((t) => window.clearTimeout(t))
    temporizadores.current = []
  }, [])

  const despues = useCallback((fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }, [])

  // Al terminar la partida (cualquier motivo) no queda nada pendiente.
  useEffect(() => {
    if (!jugando) limpiar()
  }, [jugando, limpiar])
  useEffect(() => limpiar, [limpiar])

  // Al terminar (completar, sin vidas o sin tiempo) sale UNA respuesta con lo acertado.
  useEffect(() => {
    if (!motivoFin || emitidaRef.current) return
    emitidaRef.current = true
    const raw = { puntosObtenidos: puntaje, puntosMaximos: Math.max(preguntas.length, 1) }
    alEvaluar(evaluateActivityResponse(tipo, actividad, raw))
    salida(raw)
    // Solo reacciona al fin de la partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivoFin])

  const responderPregunta = useCallback(
    (correcta: boolean, texto: string) => {
      if (correcta) {
        setPuntaje((p) => p + 1)
        feedback.emitir('acierto', { movimiento: false })
        setAnuncio(`Correcto: ${texto}.`)
      } else {
        feedback.emitir('error', { movimiento: false })
        setAnuncio(`Incorrecto: ${texto}.`)
        perderVidaRef.current()
      }
    },
    [feedback],
  )

  const programarAvance = useCallback(
    (desde: number, espera: number) => {
      const siguiente = desde + 1
      despues(() => {
        if (!jugandoRef.current) return
        if (siguiente >= preguntas.length) {
          completarRef.current()
        } else {
          setIndicePregunta(siguiente)
          lanzarRef.current(siguiente)
        }
      }, espera)
    },
    [despues, preguntas.length],
  )

  const perderVidaEstable = useCallback(() => perderVidaRef.current(), [])

  return {
    jugando,
    jugandoRef,
    indicePregunta,
    puntaje,
    anuncio,
    setAnuncio,
    despues,
    limpiar,
    perderVida: perderVidaEstable,
    responder: responderPregunta,
    programarAvance,
    lanzarRef,
  }
}
