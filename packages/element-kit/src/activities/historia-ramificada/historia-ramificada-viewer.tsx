'use client'

/**
 * Viewer de Historia ramificada sobre el `ActivityShell` (U9d.4).
 *
 * El shell aporta el reloj (si el docente fija un límite), los tokens de estilo y la pantalla de
 * resultados. Lo que sale hacia `@lumina/scoring` NO cambió: UNA respuesta `{ historial }` al llegar
 * a un nodo final (o, si hay límite de tiempo y se agota, el recorrido hasta ese momento); sale por
 * `onResponse` (canal unificado, DU2) y `onComplete` se acepta solo como alias transitorio.
 * El progreso («N pasos») y «Volver atrás» siguen siendo propios del tipo (`mostrarProgreso`,
 * `permitirRetroceder`).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HistoriaRamificadaActivity } from '@lumina/types/slide'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { useActivityFeedback } from '../_shared/activity-feedback.js'
import { normalizarAjustes } from '../_shared/activity-settings.js'
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js'
import { COLORES_NODO, COLOR_NODO_DEFAULT, esNodoFinal } from './historia-ramificada-config.js'
import styles from './historia-ramificada.module.css'

export interface HistoriaRamificadaViewerProps {
  actividad: HistoriaRamificadaActivity
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void
}

interface PasoHistorial {
  nodoId: string
  opcionElegida?: string
  fueCorrecta?: boolean
}

const MS_FEEDBACK = 1200
/** Pausa entre llegar al final y abrir el resultado, para ver el nodo final. */
const MS_RESULTADO = 800

const hayEvaluacion = (nodos: HistoriaRamificadaActivity['nodos']) =>
  nodos.some(
    (n) =>
      n.tipo === 'final_bueno' ||
      n.tipo === 'final_malo' ||
      (n.tipo === 'pregunta' && n.opciones?.some((o) => o.esCorrecta !== undefined)),
  )

interface CuerpoProps {
  actividad: HistoriaRamificadaActivity
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, nodos, conexiones, nodoInicial } = actividad
  const jugando = ctx.sesion.fase === 'jugando'
  const motivoFin = ctx.sesion.motivoFin
  const { completar } = ctx
  const feedbackSonoro = useActivityFeedback({ sonido: ctx.ajustes.sonido })

  const [historial, setHistorial] = useState<PasoHistorial[]>([{ nodoId: nodoInicial }])
  const [feedback, setFeedback] = useState<string | null>(null)
  const emitidaRef = useRef(false)
  const historialRef = useRef(historial)
  const temporizadores = useRef<number[]>([])
  const jugandoRef = useRef(jugando)
  const completarRef = useRef(completar)

  useEffect(() => {
    historialRef.current = historial
    jugandoRef.current = jugando
    completarRef.current = completar
  })
  useEffect(
    () => () => {
      temporizadores.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const nodoActualId = historial[historial.length - 1]!.nodoId
  const nodoActual = nodos.find((n) => n.id === nodoActualId)
  const esFinal = nodoActual ? esNodoFinal(nodoActual.tipo) : false
  const tieneEvaluacion = hayEvaluacion(nodos)

  const emitir = useCallback(
    (pasos: PasoHistorial[]) => {
      if (emitidaRef.current) return
      emitidaRef.current = true
      const raw = {
        historial: pasos.map(({ nodoId, opcionElegida }) => ({ nodoId, ...(opcionElegida ? { opcionElegida } : {}) })),
      }
      alEvaluar(evaluateActivityResponse('historia_ramificada', actividad, raw))
      responder(raw)
    },
    [actividad, alEvaluar, responder],
  )

  // Con límite de tiempo: si se agota, sale el recorrido hecho hasta ahora.
  useEffect(() => {
    if (motivoFin === 'sin_tiempo') emitir(historialRef.current)
    // Solo reacciona al fin por tiempo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivoFin])

  const despues = (fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }

  const handleOpcion = (opcionId: string) => {
    if (!nodoActual || !jugando) return
    setFeedback(null)
    const opcion = nodoActual.opciones?.find((o) => o.id === opcionId)
    if (!opcion) return
    if (opcion.feedback) setFeedback(opcion.feedback)
    if (opcion.esCorrecta !== undefined) feedbackSonoro.emitir(opcion.esCorrecta ? 'acierto' : 'error', { movimiento: false })

    const conexion = conexiones.find((c) => c.desdeNodoId === nodoActualId && c.opcionId === opcionId)
    const fueCorrecta = opcion.esCorrecta === true

    despues(
      () => {
        setFeedback(null)
        if (!conexion || !jugandoRef.current) return
        const nuevoPaso: PasoHistorial = {
          nodoId: conexion.haciaNodoId,
          opcionElegida: opcionId,
          fueCorrecta: opcion.esCorrecta !== undefined ? fueCorrecta : undefined,
        }
        const nuevo = [...historialRef.current, nuevoPaso]
        historialRef.current = nuevo
        setHistorial(nuevo)

        const destino = nodos.find((n) => n.id === conexion.haciaNodoId)
        if (destino && esNodoFinal(destino.tipo)) {
          emitir(nuevo)
          despues(() => completarRef.current(), MS_RESULTADO)
        }
      },
      opcion.feedback ? MS_FEEDBACK : 0,
    )
  }

  const handleRetroceder = () => {
    if (historial.length <= 1) return
    setHistorial((h) => h.slice(0, -1))
    setFeedback(null)
  }

  if (!nodoActual) return null

  const colorNodo = COLORES_NODO[nodoActual.tipo] ?? COLOR_NODO_DEFAULT
  const progreso = tieneEvaluacion
    ? historial.filter((p) => nodos.find((nd) => nd.id === p.nodoId)?.tipo === 'pregunta').length
    : historial.length - 1
  const totalPreguntas = nodos.filter((n) => n.tipo === 'pregunta').length
  const correctasHistorial = historial.filter((p) => p.fueCorrecta === true).length
  const anuncio = feedback ? `Retroalimentación: ${feedback}` : `${nodoActual.titulo ?? nodoActual.tipo}. ${nodoActual.contenido.texto ?? ''}`

  return (
    <div className={styles.raiz} style={{ '--color-nodo': colorNodo } as React.CSSProperties}>
      {configuracion.mostrarProgreso && (
        <div className={styles.progreso}>
          <div className={styles.progresoTexto}>
            <span>Progreso</span>
            <span>{historial.length - 1} pasos</span>
          </div>
          <div className={styles.progresoPista}>
            <div
              className={styles.progresoRelleno}
              style={{ width: totalPreguntas > 0 ? `${(progreso / totalPreguntas) * 100}%` : '10%' }}
            />
          </div>
        </div>
      )}

      <div className={styles.nodo}>
        <div className={styles.insignia}>{nodoActual.titulo ?? nodoActual.tipo}</div>

        {nodoActual.contenido.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={nodoActual.contenido.imagen} alt="" className={styles.imagen} />
        )}

        {nodoActual.contenido.texto && <p className={styles.texto}>{nodoActual.contenido.texto}</p>}

        {feedback && <div className={styles.feedback}>{feedback}</div>}

        {!esFinal && nodoActual.opciones && nodoActual.opciones.length > 0 && !feedback && (
          <div className={styles.opciones}>
            {nodoActual.opciones.map((opcion) => {
              const tieneConexion = conexiones.some((c) => c.desdeNodoId === nodoActualId && c.opcionId === opcion.id)
              return (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => handleOpcion(opcion.id)}
                  disabled={!tieneConexion || !jugando}
                  className={styles.opcion}
                >
                  {opcion.texto}
                  {!tieneConexion && <span className={styles.sinConexion}>(sin conexión)</span>}
                </button>
              )
            })}
          </div>
        )}

        {esFinal && (
          <div className={styles.final}>
            <div className={styles.emoji}>{nodoActual.tipo === 'final_bueno' ? '🏆' : '😔'}</div>
            {tieneEvaluacion && <div className={styles.correctas}>Respuestas correctas: {correctasHistorial}</div>}
          </div>
        )}
      </div>

      {configuracion.permitirRetroceder && historial.length > 1 && !esFinal && (
        <div className={styles.volver}>
          <button type="button" onClick={handleRetroceder} className={styles.volverBoton} disabled={!jugando}>
            ← Volver atrás
          </button>
        </div>
      )}

      {/* El lector de pantalla oye el nodo nuevo (o el feedback de la opción elegida). */}
      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>
    </div>
  )
}

export function HistoriaRamificadaViewer({ actividad, onResponse, onComplete }: HistoriaRamificadaViewerProps) {
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad])
  // Se recorre una sola vez (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes])
  const evaluable = hayEvaluacion(actividad.nodos)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const salida = useRef(onResponse ?? onComplete)
  useEffect(() => {
    salida.current = onResponse ?? onComplete
  }, [onResponse, onComplete])
  const responder = useCallback((r: unknown) => salida.current?.(r), [])

  return (
    <ActivityShell
      ajustes={ajustesShell}
      evaluation={evaluation}
      resultado={evaluable && evaluation?.score !== null ? 'dialogo' : 'ninguno'}
      className={styles.shell}
    >
      {(ctx) => <Cuerpo actividad={actividad} ctx={ctx} responder={responder} alEvaluar={setEvaluation} />}
    </ActivityShell>
  )
}
