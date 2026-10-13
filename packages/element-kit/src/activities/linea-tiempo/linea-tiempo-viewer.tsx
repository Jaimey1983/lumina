'use client';

/**
 * Viewer de «Línea de tiempo» (U17) sobre el `ActivityShell`.
 *
 * Tarjetas de eventos sobre un eje (horizontal si hay ancho, vertical si no) que el alumno ordena
 * cronológicamente: arrastrando (ratón, táctil o teclado) o con los botones «Mover antes/después»
 * de cada tarjeta (alternativa al arrastre, DU8). El orden inicial es barajado —reproducible con
 * `ajustes.semilla`— y nunca llega ya resuelto. Al comprobar, el eje se acomoda en el orden correcto,
 * cada tarjeta dice si el alumno la había puesto en su lugar y, si `mostrarFechasAlFinal`, aparecen
 * las fechas.
 *
 * Lo que sale por `onResponse` (DU2) es `string[]` con los ids en el orden elegido (la forma de
 * `ordenar_pasos`); si se acaba el tiempo se envía el orden que había. La nota la calcula
 * `@lumina/scoring`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { LineaTiempoActivity, LineaTiempoEvento } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

import { crearAnunciosDnd, INSTRUCCIONES_DND_ES } from '../_shared/activity-dnd-a11y.js';
import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { eventosEnOrden, lineaTiempoFingerprint, normalizarLineaTiempo, ordenInicial } from './linea-tiempo-config.js';
import styles from './linea-tiempo.module.css';

type EstadoEvento = 'correcta' | 'incorrecta';

export interface LineaTiempoViewerProps {
  actividad: LineaTiempoActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

// ── Tarjeta ───────────────────────────────────────────────────────────────────
function Tarjeta({
  evento,
  posicion,
  total,
  bloqueado,
  revisada,
  estado,
  miPosicion,
  mostrarFecha,
  onMover,
}: {
  evento: LineaTiempoEvento;
  posicion: number;
  total: number;
  bloqueado: boolean;
  revisada: boolean;
  estado?: EstadoEvento;
  miPosicion?: number;
  mostrarFecha: boolean;
  onMover: (id: string, delta: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: evento.id,
    disabled: bloqueado,
    // El nombre que oyen los lectores de pantalla al arrastrar con teclado.
    data: { etiqueta: evento.texto },
    attributes: { roleDescription: 'elemento ordenable' },
  });
  const nombreEstado = estado === 'correcta' ? 'en su lugar' : estado === 'incorrecta' ? 'fuera de lugar' : undefined;
  return (
    <li
      ref={setNodeRef}
      data-evento-id={evento.id}
      data-estado={estado}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 1 : 0 }}
      className={[
        styles.tarjeta,
        isDragging ? styles.arrastrada : '',
        estado === 'correcta' ? styles.correcta : '',
        estado === 'incorrecta' ? styles.incorrecta : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {mostrarFecha && <span className={styles.fecha}>{evento.fechaTexto || 'Sin fecha'}</span>}
      <span className={styles.marca} aria-hidden="true">
        {posicion + 1}
      </span>
      {evento.imagen && <img src={evento.imagen} alt="" className={styles.imagen} draggable={false} />}
      <span className={styles.texto}>{evento.texto}</span>
      {revisada && (
        <span className={styles.veredicto}>
          {/* El color solo no basta: el estado también se dice con palabras. */}
          {nombreEstado}
          {estado === 'incorrecta' && miPosicion ? ` (la pusiste en ${miPosicion}.º lugar)` : ''}
        </span>
      )}
      {!revisada && (
        <span className={styles.controles}>
          <button
            type="button"
            className={styles.asa}
            aria-label={`Arrastrar «${evento.texto}»`}
            disabled={bloqueado}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.flecha}
            aria-label={`Mover «${evento.texto}» antes`}
            disabled={bloqueado || posicion === 0}
            onClick={() => onMover(evento.id, -1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.flecha}
            aria-label={`Mover «${evento.texto}» después`}
            disabled={bloqueado || posicion === total - 1}
            onClick={() => onMover(evento.id, 1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </span>
      )}
    </li>
  );
}

// ── Cuerpo ────────────────────────────────────────────────────────────────────
interface CuerpoProps {
  act: LineaTiempoActivity;
  orden: LineaTiempoEvento[];
  setOrden: React.Dispatch<React.SetStateAction<LineaTiempoEvento[]>>;
  estados: Record<string, EstadoEvento>;
  enviado: LineaTiempoEvento[] | null;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult, enviado: LineaTiempoEvento[], estados: Record<string, EstadoEvento>) => void;
}

function Cuerpo({ act, orden, setOrden, estados, enviado, ctx, responder, alEvaluar }: CuerpoProps) {
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });
  const [anuncio, setAnuncio] = useState('');
  const emitidoEn = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const accesibilidad = useMemo(
    () => ({ announcements: crearAnunciosDnd(), screenReaderInstructions: INSTRUCCIONES_DND_ES }),
    [],
  );

  // No hay «piezas por colocar»: todas están en el eje desde el principio.
  useEffect(() => {
    setProgreso(0);
  }, [setProgreso]);

  const estadosDe = useCallback(
    (evaluada: ActivityEvaluationResult) => {
      const correcto = eventosEnOrden(act.eventos);
      const nuevos: Record<string, EstadoEvento> = {};
      correcto.forEach((e, pos) => {
        nuevos[e.id] = evaluada.details[pos]?.correct ? 'correcta' : 'incorrecta';
      });
      return nuevos;
    },
    [act.eventos],
  );

  const comprobar = () => {
    if (!jugando) return;
    const raw = orden.map((e) => e.id);
    const evaluada = evaluateActivityResponse('linea_tiempo', act, raw);
    alEvaluar(evaluada, orden, estadosDe(evaluada));
    feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
    responder(raw);
    completar();
  };

  // Se acabó el tiempo: se envía el orden que había (una vez por corrida).
  useEffect(() => {
    if (ctx.sesion.motivoFin !== 'sin_tiempo' || emitidoEn.current === ctx.sesion.intento) return;
    emitidoEn.current = ctx.sesion.intento;
    const raw = orden.map((e) => e.id);
    const evaluada = evaluateActivityResponse('linea_tiempo', act, raw);
    alEvaluar(evaluada, orden, estadosDe(evaluada));
    responder(raw);
  }, [ctx.sesion.motivoFin, ctx.sesion.intento, act, orden, alEvaluar, estadosDe, responder]);

  const alSoltar = (e: DragEndEvent) => {
    if (!jugando || !e.over || e.active.id === e.over.id) return;
    setOrden((prev) => {
      const de = prev.findIndex((x) => x.id === e.active.id);
      const a = prev.findIndex((x) => x.id === e.over!.id);
      return de < 0 || a < 0 ? prev : arrayMove(prev, de, a);
    });
  };

  const mover = useCallback(
    (id: string, delta: -1 | 1) => {
      if (!jugando) return;
      const de = orden.findIndex((e) => e.id === id);
      const a = de + delta;
      if (de < 0 || a < 0 || a >= orden.length) return;
      setOrden(arrayMove(orden, de, a));
      setAnuncio(`«${orden[de]!.texto}» ahora es el número ${a + 1} de ${orden.length}.`);
    },
    [jugando, orden, setOrden],
  );

  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const revisada = !jugando && enviado !== null;
  // Al revisar, el eje se acomoda en el orden correcto.
  const mostrados = revisada ? eventosEnOrden(act.eventos) : orden;
  const posicionEnviada = (id: string) => (enviado?.findIndex((e) => e.id === id) ?? -1) + 1;

  return (
    <div className={styles.raiz}>
      {act.instruccion && <p className={styles.instruccion}>{act.instruccion}</p>}
      {!revisada && <p className={styles.ayuda}>Ordénalos del más antiguo (izquierda o arriba) al más reciente.</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={accesibilidad}
        onDragEnd={alSoltar}
      >
        <SortableContext items={mostrados.map((e) => e.id)} strategy={rectSortingStrategy}>
          <ol className={styles.eje} aria-label="Línea de tiempo">
            {mostrados.map((e, i) => (
              <Tarjeta
                key={e.id}
                evento={e}
                posicion={i}
                total={mostrados.length}
                bloqueado={!jugando}
                revisada={revisada}
                estado={revisada ? estados[e.id] : undefined}
                miPosicion={revisada ? posicionEnviada(e.id) : undefined}
                mostrarFecha={revisada && act.mostrarFechasAlFinal}
                onMover={mover}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>

      <div className={styles.acciones}>
        {jugando && (
          <button type="button" className={styles.comprobar} onClick={comprobar}>
            Comprobar
          </button>
        )}
        {sinTiempo && (
          <p role="status" className={styles.estado}>
            Se acabó el tiempo.
          </p>
        )}
      </div>
    </div>
  );
}

export function LineaTiempoViewer({ actividad, onResponse }: LineaTiempoViewerProps) {
  const act = useMemo(() => normalizarLineaTiempo(actividad), [actividad]);
  const huella = useMemo(() => lineaTiempoFingerprint(act), [act]);
  const ajustes = useMemo(() => normalizarAjustes(act), [act]);
  const semilla = ajustes.semilla;
  const corrida = useRef(0);

  const [orden, setOrden] = useState(() => ordenInicial(act.eventos, semilla, 0));
  const [estados, setEstados] = useState<Record<string, EstadoEvento>>({});
  const [enviado, setEnviado] = useState<LineaTiempoEvento[] | null>(null);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const reiniciar = useCallback(() => {
    corrida.current += 1;
    setOrden(ordenInicial(act.eventos, semilla, corrida.current));
    setEstados({});
    setEnviado(null);
    setEvaluation(null);
  }, [act.eventos, semilla]);

  // Editar el contenido (o cambiar de slide) es una corrida nueva; cambiar solo un ajuste, no.
  const reiniciarRef = useRef(reiniciar);
  useEffect(() => {
    reiniciarRef.current = reiniciar;
  }, [reiniciar]);
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    reiniciarRef.current();
  }, [huella]);

  return (
    <ActivityShell
      key={huella}
      ajustes={ajustes}
      total={act.eventos.length}
      evaluation={evaluation}
      onReintentar={reiniciar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          act={act}
          orden={orden}
          setOrden={setOrden}
          estados={estados}
          enviado={enviado}
          ctx={ctx}
          responder={responder}
          alEvaluar={(e, env, nuevos) => {
            setEvaluation(e);
            setEnviado(env);
            setEstados(nuevos);
          }}
        />
      )}
    </ActivityShell>
  );
}
