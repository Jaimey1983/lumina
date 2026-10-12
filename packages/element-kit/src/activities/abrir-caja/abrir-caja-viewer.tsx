'use client'

/**
 * Viewer de Abrir la caja sobre el `ActivityShell` (U9d.3).
 *
 * El shell aporta el reloj (si el docente fija un límite), el progreso y la pantalla de resultados.
 * Lo que sale hacia `@lumina/scoring` NO cambió: UNA respuesta `{ cajasAbiertas }` al abrir la
 * última caja (o, si hay límite de tiempo y se agota, las abiertas hasta entonces); sale por
 * `onResponse` (canal unificado, DU2) y `onComplete` se acepta solo como alias transitorio.
 * Si ninguna caja marca `esCorrecta` la actividad no es evaluable y no muestra resultado.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AbrirCajaActivity } from '@lumina/types/slide'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { useActivityFeedback } from '../_shared/activity-feedback.js'
import { normalizarAjustes } from '../_shared/activity-settings.js'
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js'
import {
  abrirCajaFingerprint,
  duracionTotalAperturaAbrirCaja,
  ABRIR_CAJA_DURACION_CIERRE_MS,
  esEvaluable,
  normalizarAbrirCaja,
} from './abrir-caja-config.js'
import styles from './abrir-caja.module.css'
import {
  ABRIR_CAJA_GAP_PX,
  CajaIcon,
  tamanoEtiquetaCaja,
  tamanoIconoCaja,
  useAbrirCajaCellSize,
} from './abrir-caja-shared.js'

interface CajaEstado {
  abierta: boolean
  animando: boolean
  fase?: 'cierre' | 'revelacion'
}

export interface AbrirCajaViewerProps {
  actividad: AbrirCajaActivity
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void
}

function buildEstadosIniciales(cajas: { id: string }[]): Record<string, CajaEstado> {
  return Object.fromEntries(cajas.map((c) => [c.id, { abierta: false, animando: false }]))
}

function getAnimClass(animacion: 'flip' | 'zoom' | 'fade', fase: CajaEstado['fase']): string | undefined {
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

interface CuerpoProps {
  actividad: AbrirCajaActivity
  ctx: ActivityShellContext
  evaluable: boolean
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, ctx, evaluable, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, cajas } = actividad
  const { filas, columnas, colorCaja, animacionApertura } = configuracion
  const gridAreaRef = useRef<HTMLDivElement>(null)
  const cellSize = useAbrirCajaCellSize(gridAreaRef, filas, columnas)
  const jugando = ctx.sesion.fase === 'jugando'
  const motivoFin = ctx.sesion.motivoFin
  const { setProgreso, completar } = ctx
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })

  const [estados, setEstados] = useState<Record<string, CajaEstado>>(() => buildEstadosIniciales(cajas))
  const [anuncio, setAnuncio] = useState('')
  const emitidaRef = useRef(false)
  const temporizadores = useRef<number[]>([])

  useEffect(
    () => () => {
      temporizadores.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const abiertasIds = useMemo(() => cajas.filter((c) => estados[c.id]?.abierta).map((c) => c.id), [cajas, estados])

  useEffect(() => {
    setProgreso(abiertasIds.length, cajas.length)
  }, [abiertasIds.length, cajas.length, setProgreso])

  const emitir = useCallback(
    (ids: string[]) => {
      if (emitidaRef.current) return
      emitidaRef.current = true
      const raw = { cajasAbiertas: ids }
      alEvaluar(evaluateActivityResponse('abrir_caja', actividad, raw))
      responder(raw)
    },
    [actividad, alEvaluar, responder],
  )

  // Al abrir la última caja termina la actividad con UNA respuesta.
  useEffect(() => {
    if (cajas.length === 0 || abiertasIds.length < cajas.length) return
    emitir(abiertasIds)
    completar()
  }, [abiertasIds, cajas.length, emitir, completar])

  // Con límite de tiempo: si se agota, sale lo abierto hasta ahora.
  useEffect(() => {
    if (motivoFin === 'sin_tiempo') emitir(abiertasIds)
    // Solo reacciona al fin por tiempo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivoFin])

  const despues = (fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }

  const abrirCaja = (id: string) => {
    if (!jugando) return
    const caja = cajas.find((c) => c.id === id)
    setEstados((prev) => {
      if (prev[id]?.abierta || prev[id]?.animando) return prev
      if (animacionApertura === 'flip') {
        return { ...prev, [id]: { abierta: false, animando: true, fase: 'cierre' } }
      }
      return { ...prev, [id]: { abierta: true, animando: true, fase: 'revelacion' } }
    })
    if (caja) {
      const esCorrecta = caja.contenido.esCorrecta
      if (evaluable && esCorrecta !== undefined) feedback.emitir(esCorrecta ? 'acierto' : 'error', { movimiento: false })
      setAnuncio(
        `Abriste ${caja.etiqueta}${caja.contenido.texto ? `: ${caja.contenido.texto}` : ''}` +
          (evaluable && esCorrecta !== undefined ? (esCorrecta ? '. Correcta.' : '. Incorrecta.') : '.'),
      )
    }

    if (animacionApertura === 'flip') {
      despues(() => {
        setEstados((prev) => {
          const current = prev[id]
          if (!current?.animando || current.fase !== 'cierre') return prev
          return { ...prev, [id]: { abierta: true, animando: true, fase: 'revelacion' } }
        })
      }, ABRIR_CAJA_DURACION_CIERRE_MS)
    }
    despues(() => {
      setEstados((prev) => {
        const current = prev[id]
        if (!current?.animando) return prev
        return { ...prev, [id]: { abierta: true, animando: false } }
      })
    }, duracionTotalAperturaAbrirCaja(animacionApertura))
  }

  const correctasAbiertas = abiertasIds.filter((id) => cajas.find((c) => c.id === id)?.contenido.esCorrecta === true).length
  const totalCorrectas = cajas.filter((c) => c.contenido.esCorrecta === true).length
  const totalSlots = filas * columnas
  const iconSize = tamanoIconoCaja(cellSize || 48)
  const labelSize = tamanoEtiquetaCaja(cellSize || 48)

  if (cajas.length === 0) return <div className={styles.vacio}>Sin cajas configuradas</div>

  return (
    <div className={styles.raiz}>
      <p className={styles.consigna}>Toca cada caja para abrirla y descubrir su contenido</p>

      <div ref={gridAreaRef} className={styles.area}>
        {cellSize > 0 && (
          <div
            className={styles.rejilla}
            role="group"
            aria-label="Cajas"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: ABRIR_CAJA_GAP_PX,
            }}
          >
            {Array.from({ length: totalSlots }, (_, index) => {
              const caja = cajas[index]
              if (!caja) {
                return <div key={`empty-${index}`} style={{ width: cellSize, height: cellSize }} aria-hidden />
              }
              const { abierta, animando, fase } = estados[caja.id] ?? { abierta: false, animando: false }
              const esCorrecta = caja.contenido.esCorrecta
              const showClosed = !abierta || fase === 'cierre'
              const showOpen = abierta && fase !== 'cierre'
              const animClass = animando ? getAnimClass(animacionApertura, fase) : undefined
              const marca = abierta && !animando && evaluable && esCorrecta !== undefined
              const nombreAbierta = showOpen
                ? `${caja.etiqueta}: ${caja.contenido.texto ?? ''}` +
                  (evaluable && esCorrecta !== undefined ? (esCorrecta ? ', correcta' : ', incorrecta') : '')
                : undefined

              return (
                <button
                  key={caja.id}
                  type="button"
                  onClick={() => abrirCaja(caja.id)}
                  disabled={animando || abierta || !jugando}
                  aria-label={nombreAbierta}
                  className={[styles.caja, marca ? (esCorrecta ? styles.correcta : styles.incorrecta) : ''].join(' ')}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    ...(showOpen ? {} : { backgroundColor: colorCaja }),
                    cursor: animando || abierta ? 'default' : 'pointer',
                  }}
                >
                  {showClosed ? (
                    <div className={`${styles.cajaFace} ${fase === 'cierre' ? styles.animCierre : ''}`}>
                      <span className={styles.icono}>
                        <CajaIcon size={iconSize} />
                      </span>
                      <span className={styles.etiqueta} style={{ fontSize: labelSize }}>
                        {caja.etiqueta}
                      </span>
                    </div>
                  ) : null}
                  {showOpen ? (
                    <div className={`${styles.cajaFace} ${styles.cajaFaceOpen} ${animClass ?? ''}`}>
                      {evaluable && esCorrecta !== undefined && (
                        <span aria-hidden style={{ fontSize: Math.max(14, labelSize + 2) }}>
                          {esCorrecta ? '✅' : '❌'}
                        </span>
                      )}
                      {caja.contenido.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={caja.contenido.imagen} alt="" className={styles.imagen} />
                      )}
                      {caja.contenido.texto && (
                        <span className={styles.contenido} style={{ fontSize: labelSize }}>
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

      <div className={styles.contador}>
        {abiertasIds.length} de {cajas.length} cajas abiertas
        {evaluable && totalCorrectas > 0 && abiertasIds.length > 0 ? ` · ${correctasAbiertas} correctas` : ''}
      </div>

      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>
    </div>
  )
}

export function AbrirCajaViewer({ actividad, onResponse, onComplete }: AbrirCajaViewerProps) {
  const fingerprint = abrirCajaFingerprint(actividad)
  const normalizada = useMemo(
    () => normalizarAbrirCaja(actividad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  )
  // El `ajustes` del slide viaja en la actividad original (la huella lo ignora a propósito).
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad])
  // Se juega una sola vez (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes])
  const evaluable = esEvaluable(normalizada.cajas)
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
      total={normalizada.cajas.length}
      evaluation={evaluation}
      resultado={evaluable ? 'dialogo' : 'ninguno'}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo actividad={normalizada} ctx={ctx} evaluable={evaluable} responder={responder} alEvaluar={setEvaluation} />
      )}
    </ActivityShell>
  )
}
