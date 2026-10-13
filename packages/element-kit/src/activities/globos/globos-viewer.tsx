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
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { GlobosActivity } from '@lumina/types/slide'

import { ArcadeActividad, useMotorArcade, type CuerpoArcadeProps } from '../_shared/motor-arcade.js'
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

function Cuerpo({ actividad, ctx, responder, alEvaluar }: CuerpoArcadeProps<GlobosActivity>) {
  const { configuracion, preguntas } = actividad
  const velBase = VELOCIDAD_PX[configuracion.velocidad]
  const motor = useMotorArcade({ actividad, tipo: 'globos', ctx, responder, alEvaluar })
  const { jugando, jugandoRef, perderVida, despues, indicePregunta, anuncio, setAnuncio, lanzarRef } = motor

  const [globos, setGlobos] = useState<GloboState[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const globosRef = useRef<GloboState[]>([])
  const respondidaRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)

  const preguntaActual = preguntas[indicePregunta]
  const metrics = useGloboMetrics(containerRef, preguntaActual?.opciones.length ?? 0)

  const poner = useCallback((lista: GloboState[]) => {
    globosRef.current = lista
    setGlobos(lista)
  }, [])

  useEffect(
    () => () => {
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
    lanzarRef.current = lanzarGlobos
  })

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
        for (let i = 0; i < escapados; i++) perderVida()
      }
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [jugando, poner, perderVida, setAnuncio])

  const pinchar = (globo: GloboState) => {
    // Una respuesta por pregunta: pinchar un segundo globo antes del avance no cuenta.
    if (!jugandoRef.current || respondidaRef.current || globo.explotando) return
    respondidaRef.current = true
    poner(globosRef.current.map((g) => (g.id === globo.id ? { ...g, explotando: true } : g)))
    despues(() => poner(globosRef.current.filter((g) => g.id !== globo.id)), MS_ESTALLIDO)
    motor.responder(globo.correcta, globo.texto)
    motor.programarAvance(indicePregunta, MS_AVANCE)
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
  return (
    <ArcadeActividad
      actividad={actividad}
      normalizar={normalizarGlobos}
      huella={globosFingerprint}
      onResponse={onResponse}
      className={styles.shell}
    >
      {(props) => <Cuerpo {...props} />}
    </ArcadeActividad>
  )
}
