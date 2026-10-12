'use client'

/**
 * Viewer de Ahorcado sobre el `ActivityShell` (U9c.1).
 *
 * El shell aporta el cronómetro, el progreso de la sesión y la pantalla de resultados; el
 * estado de la partida sigue siendo `procesarLetra` (puro). Lo que sale hacia `@lumina/scoring`
 * NO cambió: UNA respuesta `{ letrasAdivinadas, letrasFalladas }` al terminar. Sale por
 * `onResponse` (canal unificado, DU2); `onComplete` se acepta solo como alias transitorio.
 * Se juega con el teclado de pantalla o con el físico, y cada jugada se anuncia (DU8).
 *
 * Los intentos (`configuracion.maxIntentos`) siguen siendo el contador propio del juego: el
 * shell no lleva vidas aquí (`vidas: null`) para no mostrar dos contadores.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AhorcadoActivity } from '@lumina/types/slide'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { useActivityFeedback } from '../_shared/activity-feedback.js'
import { normalizarAjustes } from '../_shared/activity-settings.js'
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js'
import {
  TECLADO_AHORCADO,
  ahorcadoFingerprint,
  crearEstadoInicialAhorcado,
  normalizarAhorcado,
  normalizarPalabraAhorcado,
  procesarLetra,
  revelarPalabraAhorcado,
  terminarPorTiempoAhorcado,
} from './ahorcado-config.js'
import { AhorcadoFigure, partesMuñecoAhorcado } from './ahorcado-figure.js'
import ilustracion from './ahorcado.module.css'
import styles from './ahorcado-juego.module.css'

/** Pausa antes del resultado, para ver la figura y la palabra revelada (como siempre). */
const RETARDO_RESULTADO_MS = 350

export interface AhorcadoViewerProps {
  actividad: AhorcadoActivity
  editorSyncKey?: string
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void
}

type EstadoJuego = ReturnType<typeof crearEstadoInicialAhorcado>

interface CuerpoProps {
  actividad: AhorcadoActivity
  estado: EstadoJuego
  setEstado: React.Dispatch<React.SetStateAction<EstadoJuego>>
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, estado, setEstado, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion } = useMemo(() => normalizarAhorcado(actividad), [actividad])
  const { palabra, pista, categoria, maxIntentos } = configuracion
  const jugando = ctx.sesion.fase === 'jugando'
  const { completar } = ctx
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })
  const [anuncio, setAnuncio] = useState('')
  const terminada = useRef(false)

  // Tiempo agotado: la partida cuenta como perdida y conserva lo jugado.
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo'
  useEffect(() => {
    if (sinTiempo) setEstado((prev) => terminarPorTiempoAhorcado(prev))
  }, [sinTiempo, setEstado])

  // Al terminar: una respuesta, y el resultado tras una breve pausa.
  useEffect(() => {
    if (!estado.completado || terminada.current) return
    terminada.current = true
    const raw = { letrasAdivinadas: estado.letrasAdivinadas, letrasFalladas: estado.letrasFalladas }
    alEvaluar(evaluateActivityResponse('ahorcado', actividad, raw))
    responder(raw)
    if (estado.ganado) setAnuncio(`¡Ganaste! La palabra era ${palabra}.`)
    else setAnuncio(`Perdiste. La palabra era ${palabra}.`)
    if (sinTiempo) return undefined
    const t = window.setTimeout(() => completar(), RETARDO_RESULTADO_MS)
    return () => window.clearTimeout(t)
  }, [estado, actividad, palabra, sinTiempo, alEvaluar, responder, completar])

  const jugar = useCallback(
    (letra: string) => {
      if (!jugando) return
      const letraNorm = letra.toUpperCase()
      const antes = estado
      const despues = procesarLetra(antes, configuracion, letraNorm)
      if (despues === antes) return
      setEstado(despues)
      const acerto = despues.letrasAdivinadas.length > antes.letrasAdivinadas.length
      feedback.emitir(acerto ? 'acierto' : 'error', { movimiento: false })
      if (!despues.completado) {
        setAnuncio(
          acerto
            ? `La ${letraNorm} está en la palabra.`
            : `La ${letraNorm} no está. Te quedan ${despues.intentosRestantes} de ${maxIntentos} intentos.`,
        )
      }
    },
    [jugando, estado, configuracion, maxIntentos, setEstado, feedback],
  )

  // Teclado físico: una letra (con o sin tilde) juega esa letra.
  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return
    const base = normalizarPalabraAhorcado(e.key).replace(/\s/g, '')
    const letra = e.key.toLowerCase() === 'ñ' ? 'Ñ' : base
    if (letra.length === 1 && (TECLADO_AHORCADO as readonly string[]).includes(letra)) {
      e.preventDefault()
      jugar(letra)
    }
  }

  const slots = revelarPalabraAhorcado(palabra, estado.letrasAdivinadas, estado.ganado === false)
  const intentosUsados = estado.letrasFalladas.length
  const progresoIntentos = Math.max(0, (estado.intentosRestantes / maxIntentos) * 100)
  const partes = partesMuñecoAhorcado(intentosUsados, maxIntentos)
  const figura = estado.ganado === true ? 'ganado' : estado.ganado === false ? 'perdido' : 'jugando'
  const marco =
    figura === 'perdido'
      ? `${ilustracion.munecoWrap} ${ilustracion.munecoWrapPerdido}`
      : figura === 'ganado'
        ? `${ilustracion.munecoWrap} ${ilustracion.munecoWrapGanado}`
        : ilustracion.munecoWrap
  const palabraHablada = slots.map((s) => (s === '_' ? 'hueco' : s === ' ' ? 'espacio' : s)).join(', ')

  return (
    <div className={styles.raiz} role="group" aria-label="Ahorcado" onKeyDown={alTeclear}>
      <div className={styles.cabecera}>
        {categoria ? (
          <span className={styles.categoria}>{categoria}</span>
        ) : (
          <span className={styles.titulo}>Ahorcado</span>
        )}
        <span className={styles.intentos}>
          {estado.intentosRestantes}/{maxIntentos} intentos
        </span>
      </div>

      {pista ? <div className={styles.pista}>{pista}</div> : null}

      <div className={styles.barraWrap}>
        <div className={styles.barraIntentos} aria-hidden>
          <div className={styles.barraIntentosFill} style={{ width: `${progresoIntentos}%` }} />
        </div>
        {estado.letrasFalladas.length > 0 ? (
          <p className={styles.falladas}>Letras incorrectas: {estado.letrasFalladas.join(', ')}</p>
        ) : null}
      </div>

      <div className={styles.juegoLayout}>
        <div className={marco} aria-hidden>
          <AhorcadoFigure
            partes={partes}
            estado={figura}
            aria-label={`Ahorcado: ${partes} de 6 partes dibujadas`}
          />
        </div>

        <div className={styles.juegoPrincipal}>
          <div className={styles.palabraWrap} role="img" aria-label={`Palabra: ${palabraHablada}`}>
            {slots.map((slot, index) =>
              slot === ' ' ? (
                <span key={`space-${index}`} className={styles.huecoEspacio} />
              ) : (
                <span key={`slot-${index}`} className={styles.huecoLetra} aria-hidden>
                  {slot}
                </span>
              ),
            )}
          </div>

          {estado.ganado === false ? (
            <p className={styles.revelada}>
              La palabra era: <span>{palabra}</span>
            </p>
          ) : null}

          <div className={styles.tecladoWrap}>
            <div className={styles.tecladoGrid}>
              {TECLADO_AHORCADO.map((letra) => {
                const acertada = estado.letrasAdivinadas.includes(letra)
                const fallada = estado.letrasFalladas.includes(letra)
                return (
                  <button
                    key={letra}
                    type="button"
                    disabled={estado.completado || !jugando || acertada || fallada}
                    onClick={() => jugar(letra)}
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

      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>
      {sinTiempo && !estado.ganado && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  )
}

export function AhorcadoViewer({ actividad, editorSyncKey = '', onResponse, onComplete }: AhorcadoViewerProps) {
  const fingerprint = ahorcadoFingerprint(actividad)
  const { configuracion } = useMemo(() => normalizarAhorcado(actividad), [fingerprint])
  const { maxIntentos } = configuracion
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad])
  // Los intentos son el contador propio del juego: el shell no lleva vidas aquí.
  const ajustesShell = useMemo(() => ({ ...ajustes, vidas: null }), [ajustes])

  const [estado, setEstado] = useState(() => crearEstadoInicialAhorcado(maxIntentos))
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)
  // Cada partida nueva (otro contenido, otro slide o «Reintentar») remonta el cuerpo y el shell.
  const [partida, setPartida] = useState(0)

  const salida = useRef(onResponse ?? onComplete)
  useEffect(() => {
    salida.current = onResponse ?? onComplete
  }, [onResponse, onComplete])
  const responder = useCallback((r: unknown) => salida.current?.(r), [])

  useEffect(() => {
    setEstado(crearEstadoInicialAhorcado(maxIntentos))
    setEvaluation(null)
    setPartida((n) => n + 1)
  }, [fingerprint, editorSyncKey, maxIntentos])

  const alReintentar = useCallback(() => {
    setEstado(crearEstadoInicialAhorcado(maxIntentos))
    setEvaluation(null)
    setPartida((n) => n + 1)
  }, [maxIntentos])

  return (
    <ActivityShell
      key={partida}
      ajustes={ajustesShell}
      evaluation={evaluation}
      onReintentar={alReintentar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          estado={estado}
          setEstado={setEstado}
          ctx={ctx}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  )
}
