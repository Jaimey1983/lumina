'use client'

/**
 * Viewer de Topo sobre el `ActivityShell` (U9d.2).
 *
 * El shell aporta el reloj, las vidas, el progreso y la pantalla de resultados; aquí queda solo el
 * juego (topos que asoman, golpear, avanzar de pregunta). Lo que sale hacia `@lumina/scoring` NO
 * cambió: UNA respuesta `{ puntosObtenidos, puntosMaximos }` al terminar (por completar, por
 * quedarse sin vidas o por agotar el tiempo); sale por `onResponse` (canal unificado, DU2) y
 *
 *
 * Vidas y tiempo siguen en `configuracion.vidas` / `configuracion.tiempoLimite`
 * (`normalizarAjustes` los deriva). Un golpe equivocado cuesta una vida y, si los topos se
 * esconden sin que acertes, cuesta otra (una por pregunta, no por topo).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { TopoActivity } from '@lumina/types/slide'

import { ArcadeActividad, useMotorArcade, type CuerpoArcadeProps } from '../_shared/motor-arcade.js'
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
}

const MS_AVANCE = 400

function Cuerpo({ actividad, ctx, responder, alEvaluar }: CuerpoArcadeProps<TopoActivity>) {
  const { configuracion, preguntas } = actividad
  const { filas, columnas } = configuracion
  const totalHuecos = filas * columnas
  const tiempoVisible = TIEMPO_VISIBLE_MS[configuracion.velocidad]
  const motor = useMotorArcade({ actividad, tipo: 'topo', ctx, responder, alEvaluar })
  const { jugandoRef, perderVida, despues, limpiar, indicePregunta, anuncio, setAnuncio, lanzarRef } = motor

  const [topos, setTopos] = useState<TopoState[]>([])
  const gridAreaRef = useRef<HTMLDivElement>(null)
  const toposRef = useRef<TopoState[]>([])

  const cellSize = useTopoCellSize(gridAreaRef, filas, columnas)
  const labelSize = tamanoTextoTopo(cellSize || 48, 'Ejemplo')

  const poner = useCallback((lista: TopoState[]) => {
    toposRef.current = lista
    setTopos(lista)
  }, [])

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
          perderVida()
        }
        if (!jugandoRef.current) return
        // Si era la última pregunta, termina; si no, pasa a la siguiente tras la pausa.
        if (idx + 1 >= preguntas.length) ctx.completar()
        else motor.programarAvance(idx, MS_AVANCE)
      }, tiempoVisible)
    },
    // `motor` y `ctx` cambian en cada render: el lanzador usa sus miembros estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preguntas, totalHuecos, tiempoVisible, ctx.ajustes.semilla, poner, despues, perderVida, setAnuncio, jugandoRef],
  )

  useEffect(() => {
    lanzarRef.current = lanzarTopos
  })

  useEffect(() => {
    lanzarTopos(0)
    // Solo al montar: cada contenido nuevo remonta el cuerpo (`key` de la huella).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const golpear = (huecoIdx: number) => {
    const idx = toposRef.current.findIndex((t) => t.huecoIdx === huecoIdx)
    const topo = toposRef.current[idx]
    if (!topo?.visible || topo.golpeado || !jugandoRef.current) return
    poner(toposRef.current.map((t, i) => (i === idx ? { ...t, golpeado: true, visible: false } : t)))
    motor.responder(topo.correcta, topo.texto)
    if (topo.correcta) {
      // Acertar corta el reloj de la pregunta y pasa a la siguiente.
      limpiar()
      motor.programarAvance(indicePregunta, MS_AVANCE)
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

export function TopoViewer({ actividad, onResponse }: TopoViewerProps) {
  return (
    <ArcadeActividad
      actividad={actividad}
      normalizar={normalizarTopo}
      huella={topoFingerprint}
      onResponse={onResponse}
      className={styles.shell}
    >
      {(props) => <Cuerpo {...props} />}
    </ArcadeActividad>
  )
}
