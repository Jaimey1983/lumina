'use client'

/**
 * Viewer de Topo sobre el `ActivityShell` (U9d.2).
 *
 * El shell aporta el reloj, las vidas, el progreso y la pantalla de resultados; aquí queda solo el
 * juego (topos que asoman, golpear, avanzar de pregunta). Lo que sale hacia `@lumina/scoring` NO
 * cambió: UNA respuesta `{ puntosObtenidos, puntosMaximos }` al terminar (por completar, por
 * quedarse sin vidas o por agotar el tiempo); sale por `onResponse` (canal unificado, DU2) y
 * `onComplete` se acepta solo como alias transitorio.
 *
 * Vidas y tiempo siguen en `configuracion.vidas` / `configuracion.tiempoLimite`
 * (`normalizarAjustes` los deriva). Un golpe equivocado cuesta una vida y, si los topos se
 * esconden sin que acertes, cuesta otra (una por pregunta, no por topo).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TopoActivity } from '@lumina/types/slide'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { useActivityFeedback } from '../_shared/activity-feedback.js'
import { normalizarAjustes } from '../_shared/activity-settings.js'
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js'
import {
  TIEMPO_VISIBLE_MS,
  mezclarIndicesTopo,
  normalizarTopo,
  tamanoTextoTopo,
  topoFingerprint,
} from './topo-config.js'
import { TOPO_GAP_PX, useTopoCellSize } from './topo-shared.js'
import styles from './topo.module.css'

interface TopoState {
  huecoIdx: number
  texto: string
  correcta: boolean
  visible: boolean
  golpeado: boolean
}

export interface TopoViewerProps {
  actividad: TopoActivity
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void
}

const MS_AVANCE = 400

interface CuerpoProps {
  actividad: TopoActivity
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, preguntas } = actividad
  const { filas, columnas } = configuracion
  const totalHuecos = filas * columnas
  const tiempoVisible = TIEMPO_VISIBLE_MS[configuracion.velocidad]
  const jugando = ctx.sesion.fase === 'jugando'
  const motivoFin = ctx.sesion.motivoFin
  const { setProgreso, completar, perderVida } = ctx
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })

  const [indicePregunta, setIndicePregunta] = useState(0)
  const [topos, setTopos] = useState<TopoState[]>([])
  const [puntaje, setPuntaje] = useState(0)
  const [anuncio, setAnuncio] = useState('')

  const gridAreaRef = useRef<HTMLDivElement>(null)
  const toposRef = useRef<TopoState[]>([])
  const temporizadores = useRef<number[]>([])
  const jugandoRef = useRef(jugando)
  const emitidaRef = useRef(false)
  const perderVidaRef = useRef(perderVida)
  const completarRef = useRef(completar)
  const lanzarRef = useRef<(idx: number) => void>(() => {})

  const cellSize = useTopoCellSize(gridAreaRef, filas, columnas)
  const labelSize = tamanoTextoTopo(cellSize || 48, 'Ejemplo')

  useEffect(() => {
    jugandoRef.current = jugando
    perderVidaRef.current = perderVida
    completarRef.current = completar
  })

  useEffect(() => {
    setProgreso(puntaje, preguntas.length)
  }, [puntaje, preguntas.length, setProgreso])

  const poner = useCallback((lista: TopoState[]) => {
    toposRef.current = lista
    setTopos(lista)
  }, [])

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

  const avanzar = useCallback(
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
    [preguntas.length, despues],
  )

  const lanzarTopos = useCallback(
    (idx: number) => {
      const pregunta = preguntas[idx]
      if (!pregunta || !jugandoRef.current) return
      const opciones = pregunta.opciones.filter((op) => op.texto.trim().length > 0)
      if (opciones.length === 0) return
      const huecos = mezclarIndicesTopo(totalHuecos, ctx.ajustes.semilla, idx).slice(
        0,
        Math.min(opciones.length, totalHuecos),
      )
      poner(
        opciones.map((op, i) => ({
          huecoIdx: huecos[i] ?? i % totalHuecos,
          texto: op.texto,
          correcta: op.correcta,
          visible: true,
          golpeado: false,
        })),
      )
      setAnuncio(`Pregunta ${idx + 1} de ${preguntas.length}: ${pregunta.enunciado}`)

      // Se acabó el tiempo visible: si quedaba algún topo sin golpear, cuesta UNA vida.
      despues(() => {
        const escaparon = toposRef.current.some((t) => t.visible && !t.golpeado)
        poner(toposRef.current.map((t) => ({ ...t, visible: false })))
        if (escaparon) {
          setAnuncio('Los topos se escondieron.')
          perderVidaRef.current()
        }
        if (!jugandoRef.current) return
        if (idx + 1 >= preguntas.length) completarRef.current()
        else avanzar(idx, MS_AVANCE)
      }, tiempoVisible)
    },
    [preguntas, totalHuecos, tiempoVisible, ctx.ajustes.semilla, poner, despues, avanzar],
  )

  useEffect(() => {
    lanzarRef.current = lanzarTopos
  }, [lanzarTopos])

  useEffect(() => {
    lanzarTopos(0)
    // Solo al montar: cada contenido nuevo remonta el cuerpo (`key` de la huella).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al terminar (completar, sin vidas o sin tiempo) sale UNA respuesta con lo acertado.
  useEffect(() => {
    if (!motivoFin || emitidaRef.current) return
    emitidaRef.current = true
    const raw = { puntosObtenidos: puntaje, puntosMaximos: Math.max(preguntas.length, 1) }
    alEvaluar(evaluateActivityResponse('topo', actividad, raw))
    responder(raw)
    // Solo reacciona al fin de la partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivoFin])

  const golpear = (huecoIdx: number) => {
    const idx = toposRef.current.findIndex((t) => t.huecoIdx === huecoIdx)
    const topo = toposRef.current[idx]
    if (!topo?.visible || topo.golpeado || !jugandoRef.current) return
    poner(toposRef.current.map((t, i) => (i === idx ? { ...t, golpeado: true, visible: false } : t)))

    if (topo.correcta) {
      setPuntaje((p) => p + 1)
      feedback.emitir('acierto', { movimiento: false })
      setAnuncio(`Correcto: ${topo.texto}.`)
      limpiar()
      avanzar(indicePregunta, MS_AVANCE)
    } else {
      feedback.emitir('error', { movimiento: false })
      setAnuncio(`Incorrecto: ${topo.texto}.`)
      perderVida()
    }
  }

  const preguntaActual = preguntas[indicePregunta]

  return (
    <div className={styles.raiz}>
      {preguntaActual && <div className={styles.pregunta}>{preguntaActual.enunciado}</div>}

      <div ref={gridAreaRef} className={styles.area}>
        {cellSize > 0 && (
          <div
            className={styles.rejilla}
            role="group"
            aria-label="Huecos del topo"
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
                  aria-label={visible ? undefined : 'Hueco vacío'}
                  onClick={() => golpear(huecoIdx)}
                  className={`${styles.hueco} ${visible ? styles.huecoActivo : styles.huecoVacio}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    fontSize: visible && topo?.texto ? tamanoTextoTopo(cellSize, topo.texto) : labelSize,
                  }}
                >
                  {visible ? <span className={styles.texto}>{topo?.texto}</span> : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>
    </div>
  )
}

export function TopoViewer({ actividad, onResponse, onComplete }: TopoViewerProps) {
  const fingerprint = topoFingerprint(actividad)
  // El contenido normalizado (vidas y tiempo con su valor por defecto) alimenta también los ajustes.
  const normalizada = useMemo(
    () => normalizarTopo(actividad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  )
  const ajustes = useMemo(() => normalizarAjustes(normalizada), [normalizada])
  // Se juega una sola vez (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes])
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const salida = useRef(onResponse ?? onComplete)
  useEffect(() => {
    salida.current = onResponse ?? onComplete
  }, [onResponse, onComplete])
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
