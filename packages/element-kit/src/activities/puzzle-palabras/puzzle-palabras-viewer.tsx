'use client'

/**
 * Viewer de Puzzle de palabras sobre el `ActivityShell` (U9b.1).
 *
 * El shell aporta fases, cronómetro, progreso y la pantalla de resultados; el estado de cada
 * oración es puro (`puzzle-palabras-estado.ts`). Lo que sale hacia `@lumina/scoring` NO cambió:
 * una sola respuesta final `{ tokensPorOracion }` al finalizar, sin borradores. Sale por
 * `onResponse` (canal unificado, DU2); `onComplete` se acepta solo como alias transitorio.
 * Se puede arrastrar (ratón, táctil o teclado) o usar «tocar y colocar» (DU8).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import type { PuzzlePalabrasActivity } from '@lumina/types/slide'
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
import {
  ZONA_DESTINO,
  ZONA_ORIGEN,
  crearEstadoOracion,
  moverToken,
  verificarOracion,
  type EstadoOracion,
} from './puzzle-palabras-estado.js'
import styles from './puzzle-palabras.module.css'

// ── Zona droppable ────────────────────────────────────────────────────────────
function ZonaDroppable({
  id,
  etiqueta,
  className,
  children,
  propsTocar,
}: {
  id: string
  etiqueta: string
  className: string
  children: React.ReactNode
  propsTocar?: React.HTMLAttributes<HTMLElement>
}) {
  // `data.etiqueta` es el nombre que oyen los lectores de pantalla al arrastrar con teclado.
  const { setNodeRef, isOver } = useDroppable({ id, data: { etiqueta } })
  return (
    <div
      ref={setNodeRef}
      {...propsTocar}
      aria-label={propsTocar ? etiqueta : undefined}
      className={[styles.zona, className, isOver ? styles.zonaSobre : ''].join(' ')}
    >
      {children}
    </div>
  )
}

export interface PuzzlePalabrasViewerProps {
  actividad: PuzzlePalabrasActivity
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void
}

interface CuerpoProps {
  actividad: PuzzlePalabrasActivity
  estados: EstadoOracion[]
  setEstados: React.Dispatch<React.SetStateAction<EstadoOracion[]>>
  indice: number
  setIndice: (n: number | ((n: number) => number)) => void
  crear: (texto: string, sal: number, prefijo?: string) => EstadoOracion
  ctx: ActivityShellContext
  responder: (r: unknown) => void
  alEvaluar: (e: ActivityEvaluationResult) => void
}

function Cuerpo({ actividad, estados, setEstados, indice, setIndice, crear, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, oraciones } = actividad
  const oracion = oraciones[indice]
  const estado = estados[indice]
  const jugando = ctx.sesion.fase === 'jugando'
  const { setProgreso, completar } = ctx
  const [activo, setActivo] = useState<string | null>(null)
  const reintentos = useRef<Record<number, number>>({})
  const entrada = useModoEntrada()
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido })
  const tocar = entrada.modo === 'tocar'

  // El encabezado del shell cuenta las oraciones ya verificadas.
  const verificadas = estados.filter((e) => e.verificado).length
  useEffect(() => {
    setProgreso(verificadas)
  }, [verificadas, setProgreso])

  const aplicar = useCallback(
    (id: string, sobre: string) => {
      if (!jugando) return
      setEstados((prev) => prev.map((e, i) => (i === indice ? moverToken(e, id, sobre) : e)))
    },
    [indice, jugando, setEstados],
  )

  const textoDe = useCallback(
    (id: string) =>
      [...estado.tokensOrigen, ...estado.tokensDestino].find((t) => t.id === id)?.texto,
    [estado],
  )
  const nombreZona = useCallback(
    (id: string) => (id === ZONA_DESTINO ? 'la zona de la oración' : 'las palabras disponibles'),
    [],
  )

  const tocarColocar = useTocarColocar({
    onColocar: aplicar,
    etiquetaItem: textoDe,
    etiquetaZona: nombreZona,
    deshabilitado: !tocar || !jugando || estado.verificado,
  })

  const alSoltar = useCallback(
    (e: DragEndEvent) => {
      setActivo(null)
      if (!e.over) return
      aplicar(e.active.id as string, e.over.id as string)
    },
    [aplicar],
  )

  const verificar = () => {
    if (!jugando) return
    const verificado = verificarOracion(estado, oracion.texto)
    setEstados((prev) => prev.map((e, i) => (i === indice ? verificado : e)))
    // Solo suena: no hay animación en las piezas.
    feedback.emitir(verificado.correcta ? 'acierto' : 'error', { movimiento: false })
  }

  const reintentar = () => {
    if (!jugando) return
    const n = (reintentos.current[indice] = (reintentos.current[indice] ?? 0) + 1)
    setEstados((prev) =>
      prev.map((e, i) => (i === indice ? crear(oracion.texto, indice * 100 + n, 'tok-r') : e)),
    )
  }

  const siguiente = () => {
    if (!jugando) return
    if (indice < oraciones.length - 1) {
      setIndice((i) => i + 1)
      return
    }
    const raw = { tokensPorOracion: estados.map((e) => e.tokensDestino.map((t) => t.texto)) }
    alEvaluar(evaluateActivityResponse('puzzle_palabras', actividad, raw))
    responder(raw)
    completar()
  }

  const arrastrada = activo ? textoDe(activo) : undefined
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo'

  const pieza = ({ id, texto }: { id: string; texto: string }) => (
    <ActivityDragWord
      key={id}
      id={id}
      texto={texto}
      variant="palabra"
      disabled={estado.verificado || !jugando}
      propsTocar={tocar ? tocarColocar.propsItem(id) : undefined}
    />
  )

  return (
    <div className={styles.raiz}>
      <div className={styles.cabecera}>
        <span className={styles.progreso}>
          Oración {indice + 1} de {oraciones.length}
        </span>
        <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
      </div>

      {configuracion.mostrarPista && oracion.pista && (
        <div className={styles.pista}>
          <p>💡 &quot;{oracion.pista}&quot;</p>
        </div>
      )}

      <ActivityDndRoot
        arrastreActivo={!tocar}
        onDragStart={(e: DragStartEvent) => setActivo(e.active.id as string)}
        onDragEnd={alSoltar}
        overlay={arrastrada ? <div className={styles.fantasma}>{arrastrada}</div> : null}
      >
        <ZonaDroppable
          id={ZONA_ORIGEN}
          etiqueta="Palabras disponibles"
          className={styles.origen}
          propsTocar={tocar ? tocarColocar.propsZona(ZONA_ORIGEN) : undefined}
        >
          <p className={styles.rotulo}>Palabras disponibles:</p>
          <div className={styles.piezas}>{estado.tokensOrigen.map(pieza)}</div>
        </ZonaDroppable>

        <ZonaDroppable
          id={ZONA_DESTINO}
          etiqueta="Tu oración"
          className={styles.destino}
          propsTocar={tocar ? tocarColocar.propsZona(ZONA_DESTINO) : undefined}
        >
          {estado.tokensDestino.length > 0 ? (
            <div className={styles.piezas}>{estado.tokensDestino.map(pieza)}</div>
          ) : (
            <p className={styles.vacio}>Arrastra las palabras aquí</p>
          )}
        </ZonaDroppable>
      </ActivityDndRoot>
      <AnuncioTocarColocar anuncio={tocarColocar.anuncio} />

      {!estado.verificado ? (
        <button
          type="button"
          className={styles.accion}
          onClick={verificar}
          disabled={!jugando || estado.tokensDestino.length === 0}
        >
          Verificar
        </button>
      ) : (
        <div className={styles.resultadoOracion}>
          <div
            role="status"
            className={[styles.mensaje, estado.correcta ? styles.mensajeAcierto : styles.mensajeError].join(' ')}
          >
            {estado.correcta ? (
              <p className={styles.mensajeTitulo}>✓ ¡Correcto!</p>
            ) : (
              <div>
                <p className={styles.mensajeTitulo}>✗ Incorrecto</p>
                <p className={styles.mensajeDetalle}>Respuesta: {oracion.texto}</p>
              </div>
            )}
          </div>
          <div className={styles.acciones}>
            {configuracion.permitirReintento && !estado.correcta && (
              <button type="button" className={styles.secundario} onClick={reintentar} disabled={!jugando}>
                Reintentar
              </button>
            )}
            <button type="button" className={styles.accion} onClick={siguiente} disabled={!jugando}>
              {indice < oraciones.length - 1 ? 'Siguiente' : 'Finalizar'}
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

export function PuzzlePalabrasViewer({ actividad, onResponse, onComplete }: PuzzlePalabrasViewerProps) {
  const { oraciones } = actividad
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad])
  const semilla = ajustes.semilla
  const corrida = useRef(0)

  const crear = useCallback(
    (texto: string, sal: number, prefijo = 'tok-') =>
      // `corrida` separa el orden de cada intento completo dentro de la misma semilla.
      crearEstadoOracion(texto, semilla, corrida.current * 10_000 + sal, prefijo),
    [semilla],
  )
  const [estados, setEstados] = useState<EstadoOracion[]>(() =>
    oraciones.map((o, i) => crearEstadoOracion(o.texto, semilla, i)),
  )
  const [indice, setIndice] = useState(0)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse ?? onComplete)
  useEffect(() => {
    salida.current = onResponse ?? onComplete
  }, [onResponse, onComplete])
  const responder = useCallback((r: unknown) => salida.current?.(r), [])

  const alReintentar = useCallback(() => {
    corrida.current += 1
    setEstados(oraciones.map((o, i) => crear(o.texto, i)))
    setIndice(0)
    setEvaluation(null)
  }, [oraciones, crear])

  return (
    <ActivityShell
      ajustes={ajustes}
      total={oraciones.length}
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
