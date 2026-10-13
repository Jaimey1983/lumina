'use client'

/**
 * Viewer de Anagrama sobre el `ActivityShell` (U9c.2).
 *
 * El shell aporta fases, cronómetro, progreso y la pantalla de resultados; el estado de cada
 * palabra es puro (`anagrama-estado.ts`). Lo que sale hacia `@lumina/scoring` NO cambió: UNA
 * respuesta `{ slotsPorPalabra }` al finalizar, sin borradores. Sale por `onResponse` (canal
 * unificado, DU2). Se puede arrastrar
 * (ratón, táctil o teclado) o usar «tocar y colocar» (DU8).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import type { AnagramaActivity } from '@lumina/types/slide'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring'

import { ActivityDndRoot } from '../_shared/activity-dnd-root.js'
import { ActivityDragWord } from '../_shared/activity-drag-word.js'
import { useActivityFeedback } from '../_shared/activity-feedback.js'
import { normalizarAjustes } from '../_shared/activity-settings.js'
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js'
import {
  AnuncioTocarColocar,
  ModoEntradaToggle,
  useModoEntrada,
  useTocarColocar,
} from '../_shared/activity-tap-place.js'
import { colocarLetra, crearEstadoPalabra, idHueco, type EstadoPalabra } from './anagrama-estado.js'
import styles from './anagrama.module.css'

// ── Hueco destino para una letra ──────────────────────────────────────────────
function HuecoLetra({
  indice,
  letraColocada,
  esperada,
  verificado,
  propsTocar,
}: {
  indice: number
  letraColocada: string | null
  esperada: string
  verificado: boolean
  propsTocar?: React.HTMLAttributes<HTMLElement>
}) {
  const nombre = `Casilla ${indice + 1}`
  const { setNodeRef, isOver } = useDroppable({ id: idHueco(indice), data: { etiqueta: nombre } })
  const estado =
    verificado && letraColocada !== null ? (letraColocada === esperada ? 'correcto' : 'incorrecto') : 'neutro'

  return (
    <div
      ref={setNodeRef}
      {...propsTocar}
      aria-label={
        propsTocar ? (letraColocada ? `${nombre}, con ${letraColocada}` : `${nombre}, vacía`) : undefined
      }
      className={[
        styles.hueco,
        isOver ? styles.huecoSobre : '',
        estado === 'correcto' ? styles.huecoCorrecto : '',
        estado === 'incorrecto' ? styles.huecoIncorrecto : '',
      ].join(' ')}
    >
      {letraColocada && (
        <span className={estado === 'correcto' ? styles.letraCorrecta : estado === 'incorrecto' ? styles.letraIncorrecta : ''}>
          {letraColocada}
        </span>
      )}
    </div>
  )
}

export interface AnagramaViewerProps {
  actividad: AnagramaActivity
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
}

interface CuerpoProps {
  actividad: AnagramaActivity
  estados: EstadoPalabra[]
  setEstados: React.Dispatch<React.SetStateAction<EstadoPalabra[]>>
  indice: number
  setIndice: (n: number | ((n: number) => number)) => void
  crear: (texto: string, sal: number, prefijo?: string) => EstadoPalabra
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, estados, setEstados, indice, setIndice, crear, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, palabras } = actividad
  const palabra = palabras[indice]
  const estado = estados[indice]
  const jugando = ctx.sesion.fase === 'jugando'
  const { setProgreso, completar } = ctx
  const [activa, setActiva] = useState<string | null>(null)
  const reintentos = useRef<Record<number, number>>({})
  const entrada = useModoEntrada()
  const tocar = entrada.modo === 'tocar'
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })

  const verificadas = estados.filter((e) => e.verificado).length
  useEffect(() => {
    setProgreso(verificadas)
  }, [verificadas, setProgreso])

  const aplicar = useCallback(
    (idLetra: string, destino: string) => {
      if (!jugando || !destino.startsWith('slot-')) return
      const hueco = parseInt(destino.replace('slot-', ''), 10)
      const siguiente = colocarLetra(estado, idLetra, hueco, palabra.texto)
      if (siguiente === estado) return
      setEstados((prev) => prev.map((e, i) => (i === indice ? siguiente : e)))
      if (siguiente.verificado) feedback.emitir(siguiente.correcta ? 'acierto' : 'error', { movimiento: false })
    },
    [jugando, estado, palabra.texto, indice, setEstados, feedback],
  )

  const letraDe = useCallback((id: string) => estado.letrasOrigen.find((l) => l.id === id)?.letra, [estado.letrasOrigen])
  const tocarColocar = useTocarColocar({
    onColocar: aplicar,
    etiquetaItem: (id) => (letraDe(id) ? `la letra ${letraDe(id)}` : undefined),
    etiquetaZona: (id) => `la casilla ${parseInt(id.replace('slot-', ''), 10) + 1}`,
    deshabilitado: !tocar || !jugando || estado.verificado,
  })

  const alSoltar = useCallback(
    (e: DragEndEvent) => {
      setActiva(null)
      if (!e.over) return
      aplicar(e.active.id as string, e.over.id as string)
    },
    [aplicar],
  )

  const reiniciarPalabra = () => {
    if (!jugando) return
    const n = (reintentos.current[indice] = (reintentos.current[indice] ?? 0) + 1)
    setEstados((prev) =>
      prev.map((e, i) => {
        if (i !== indice) return e
        const nuevo = crear(palabra.texto, indice * 100 + n, `letra-r${e.intentosRestantes}-`)
        return { ...nuevo, intentosRestantes: e.intentosRestantes }
      }),
    )
  }

  const siguiente = () => {
    if (!jugando) return
    if (indice < palabras.length - 1) {
      setIndice((i) => i + 1)
      return
    }
    const raw = { slotsPorPalabra: estados.map((e) => [...e.slots]) }
    alEvaluar(evaluateActivityResponse('anagrama', actividad, raw))
    responder(raw)
    completar()
  }

  const puedeReintentar = estado.verificado && estado.correcta === false && estado.intentosRestantes > 0
  const arrastrada = activa ? letraDe(activa) : undefined
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo'

  return (
    <div className={styles.raiz}>
      <div className={styles.cabecera}>
        <span className={styles.progreso}>
          Palabra {indice + 1} de {palabras.length}
        </span>
        <div className={styles.derecha}>
          {configuracion.intentos > 0 && (
            <span className={styles.intentos}>Intentos restantes: {estado.intentosRestantes}</span>
          )}
          <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
        </div>
      </div>

      {configuracion.mostrarPista && palabra.pista && (
        <div className={styles.pista}>
          <p>💡 &quot;{palabra.pista}&quot;</p>
        </div>
      )}

      <ActivityDndRoot
        arrastreActivo={!tocar}
        onDragStart={(e: DragStartEvent) => setActiva(e.active.id as string)}
        onDragEnd={alSoltar}
        overlay={arrastrada ? <div className={styles.fantasma}>{arrastrada}</div> : null}
      >
        {/* Letras origen (mezcladas) */}
        <div className={styles.zona}>
          <p className={styles.rotulo}>Letras disponibles:</p>
          <div className={styles.piezas}>
            {estado.letrasOrigen.map(({ id, letra }) => (
              <ActivityDragWord
                key={id}
                id={id}
                texto={letra}
                variant="letra"
                disabled={estado.verificado || !jugando}
                propsTocar={tocar ? tocarColocar.propsItem(id) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Huecos destino */}
        <div className={styles.zona}>
          <p className={styles.rotulo}>Coloca las letras aquí:</p>
          <div className={styles.piezas}>
            {estado.slots.map((letraEnHueco, i) => (
              <HuecoLetra
                key={`slot-${i}`}
                indice={i}
                letraColocada={letraEnHueco}
                esperada={palabra.texto[i]}
                verificado={estado.verificado}
                propsTocar={tocar ? tocarColocar.propsZona(idHueco(i)) : undefined}
              />
            ))}
          </div>
        </div>
      </ActivityDndRoot>
      <AnuncioTocarColocar anuncio={tocarColocar.anuncio} />

      {estado.verificado && (
        <div className={styles.resultadoPalabra}>
          <div role="status" className={[styles.mensaje, estado.correcta ? styles.mensajeAcierto : styles.mensajeError].join(' ')}>
            {estado.correcta ? (
              <p className={styles.mensajeTitulo}>✓ ¡Correcto!</p>
            ) : (
              <div>
                <p className={styles.mensajeTitulo}>✗ Incorrecto</p>
                <p className={styles.mensajeDetalle}>Respuesta: {palabra.texto.toUpperCase()}</p>
              </div>
            )}
          </div>
          <div className={styles.acciones}>
            {puedeReintentar && (
              <button type="button" className={styles.secundario} onClick={reiniciarPalabra} disabled={!jugando}>
                Reintentar
              </button>
            )}
            <button type="button" className={styles.accion} onClick={siguiente} disabled={!jugando}>
              {indice < palabras.length - 1 ? 'Siguiente' : 'Finalizar'}
            </button>
          </div>
        </div>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  )
}

export function AnagramaViewer({ actividad, onResponse }: AnagramaViewerProps) {
  const { configuracion, palabras } = actividad
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad])
  // `configuracion.intentos` es POR PALABRA (dato del editor): el shell no debe leerlo como los
  // intentos de la actividad completa. Solo cuenta si el docente fijó `ajustes.intentos`.
  const ajustesShell = useMemo(
    () => (actividad.ajustes?.intentos === undefined ? { ...ajustes, intentos: null } : ajustes),
    [actividad.ajustes?.intentos, ajustes],
  )
  const semilla = ajustes.semilla
  const corrida = useRef(0)

  const crear = useCallback(
    (texto: string, sal: number, prefijo = 'letra-') =>
      // `corrida` separa el orden de cada intento completo dentro de la misma semilla.
      crearEstadoPalabra(texto, configuracion.intentos, semilla, corrida.current * 10_000 + sal, prefijo),
    [configuracion.intentos, semilla],
  )
  const [estados, setEstados] = useState<EstadoPalabra[]>(() => palabras.map((p, i) => crear(p.texto, i)))
  const [indice, setIndice] = useState(0)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse)
  useEffect(() => {
    salida.current = onResponse
  }, [onResponse])
  const responder = useCallback((r: unknown) => salida.current?.(r), [])

  // «Reintentar» toda la actividad: letras nuevas y huecos vacíos (el viejo dejaba el origen vacío).
  const alReintentar = useCallback(() => {
    corrida.current += 1
    setEstados(palabras.map((p, i) => crear(p.texto, i)))
    setIndice(0)
    setEvaluation(null)
  }, [palabras, crear])

  return (
    <ActivityShell
      ajustes={ajustesShell}
      total={palabras.length}
      evaluation={evaluation}
      onReintentar={alReintentar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          estados={estados}
          setEstados={setEstados}
          indice={indice}
          setIndice={setIndice}
          crear={crear}
          ctx={ctx}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  )
}
