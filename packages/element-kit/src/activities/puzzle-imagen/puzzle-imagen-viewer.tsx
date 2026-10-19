'use client';

/**
 * Viewer de Puzzle de imagen sobre el `ActivityShell` (U9b.5).
 *
 * El shell aporta fases, cronómetro, progreso y la pantalla de resultados; el estado de las
 * piezas es puro (`puzzle-imagen-estado.ts`). Lo que sale hacia `@lumina/scoring` NO cambió: un
 * BORRADOR `wrapActivityDraftResponse({ slots })` al montar y en cada cambio del tablero, y la
 * respuesta final `{ slots }` al verificar. Sale por `onResponse` (canal unificado, DU2);
 * Se puede arrastrar (ratón, táctil o
 * teclado) o usar «tocar y colocar» (DU8).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { PuzzleImagenActivity } from '@lumina/types/slide';
import { evaluateActivityResponse, wrapActivityDraftResponse, type ActivityEvaluationResult } from '@lumina/scoring';

import { colisionPorPuntero } from '../_shared/activity-colisiones.js';
import { ActivityDndRoot } from '../_shared/activity-dnd-root.js';
import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import {
  AnuncioTocarColocar,
  ModoEntradaToggle,
  useModoEntrada,
  useTocarColocar,
} from '../_shared/activity-tap-place.js';
import { calcularTamanoCeldaPuzzle, generarOrdenMezclado, PUZZLE_IMAGEN_GAP_PX } from './puzzle-imagen-config.js';
import {
  ID_ORIGEN,
  estadoInicial,
  idPieza,
  idSlot,
  indiceDePieza,
  soltarPieza,
  type EstadoPuzzle,
} from './puzzle-imagen-estado.js';
import styles from './puzzle-imagen.module.css';

/** Soltar manda el puntero (no el área de la pieza): las zonas pequeñas aciertan a la primera. */
const COLISIONES = colisionPorPuntero();

function posicionDeFondo(index: number, filas: number, columnas: number): string {
  const row = Math.floor(index / columnas);
  const col = index % columnas;
  return `${col * (100 / Math.max(columnas - 1, 1))}% ${row * (100 / Math.max(filas - 1, 1))}%`;
}

function estiloPieza(index: number, filas: number, columnas: number, imagen: string, cellSize?: number): CSSProperties {
  return {
    ...(cellSize === undefined ? { width: '100%', height: '100%' } : { width: cellSize, height: cellSize }),
    backgroundImage: `url(${imagen})`,
    backgroundSize: `${columnas * 100}% ${filas * 100}%`,
    backgroundPosition: posicionDeFondo(index, filas, columnas),
  };
}

interface Geometria {
  filas: number;
  columnas: number;
  imagen: string;
  cellSize: number;
}

// ── Pieza arrastrable ─────────────────────────────────────────────────────────
function Pieza({
  index,
  geo,
  etiqueta,
  disabled,
  arrastrando,
  incrustada,
  elegida,
  propsTocar,
}: {
  index: number;
  geo: Geometria;
  /** Nombre hablado de la pieza (NO revela su casilla correcta). */
  etiqueta: string;
  disabled?: boolean;
  arrastrando?: boolean;
  incrustada?: boolean;
  elegida?: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: idPieza(index),
    disabled,
    data: { etiqueta },
    attributes: { roleDescription: 'pieza del puzzle' },
  });

  const style: CSSProperties = {
    ...estiloPieza(index, geo.filas, geo.columnas, geo.imagen, incrustada ? undefined : geo.cellSize),
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: arrastrando ? 0.4 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[incrustada ? styles.piezaIncrustada : styles.pieza, elegida ? styles.piezaElegida : ''].join(' ')}
      {...(disabled ? {} : { ...listeners, ...attributes })}
      {...propsTocar}
      aria-label={etiqueta}
    />
  );
}

// ── Casilla del tablero ───────────────────────────────────────────────────────
function Casilla({
  posicion,
  geo,
  piezaActual,
  etiquetaPieza,
  esCorrecta,
  mostrarNumero,
  verificado,
  elegida,
  propsTocar,
  bloqueada,
}: {
  posicion: number;
  geo: Geometria;
  piezaActual: number | null;
  etiquetaPieza: (i: number) => string;
  esCorrecta: boolean;
  mostrarNumero: boolean;
  verificado: boolean;
  elegida: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
  bloqueada: boolean;
}) {
  const nombre = `Casilla ${posicion + 1}`;
  const { setNodeRef, isOver } = useDroppable({ id: idSlot(posicion), data: { etiqueta: nombre } });
  const estado = verificado ? (esCorrecta ? styles.casillaCorrecta : styles.casillaIncorrecta) : '';

  return (
    <div
      ref={setNodeRef}
      {...propsTocar}
      aria-label={
        propsTocar
          ? piezaActual === null
            ? `${nombre}, vacía`
            : `${nombre}, con ${etiquetaPieza(piezaActual)}`
          : undefined
      }
      style={{ width: geo.cellSize, height: geo.cellSize }}
      className={[styles.casilla, estado, isOver ? styles.casillaSobre : '', elegida ? styles.casillaElegida : ''].join(' ')}
    >
      {piezaActual !== null ? (
        <Pieza
          index={piezaActual}
          geo={geo}
          etiqueta={etiquetaPieza(piezaActual)}
          disabled={bloqueada || verificado}
          incrustada
          // En modo tocar la casilla ocupada es la que se toca: la pieza no recibe el clic.
          propsTocar={propsTocar ? { 'aria-hidden': true, tabIndex: -1 } : undefined}
        />
      ) : (
        mostrarNumero && (
          <span className={styles.numeroCasilla} style={{ fontSize: Math.max(10, Math.floor(geo.cellSize * 0.22)) }}>
            {posicion + 1}
          </span>
        )
      )}
    </div>
  );
}

// ── Origen (piezas sueltas) ───────────────────────────────────────────────────
function Origen({
  geo,
  piezas,
  etiquetaPieza,
  bloqueado,
  activa,
  elegida,
  propsTocar,
  propsPieza,
}: {
  geo: Geometria;
  piezas: number[];
  etiquetaPieza: (i: number) => string;
  bloqueado: boolean;
  activa: string | null;
  elegida: string | null;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
  propsPieza: (i: number) => React.HTMLAttributes<HTMLElement> | undefined;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: ID_ORIGEN, data: { etiqueta: 'Piezas sueltas' } });
  if (geo.cellSize <= 0) return null;
  const gap = PUZZLE_IMAGEN_GAP_PX;

  return (
    <div
      ref={setNodeRef}
      {...propsTocar}
      aria-label={propsTocar ? 'Piezas sueltas' : undefined}
      className={[styles.origen, isOver ? styles.origenSobre : ''].join(' ')}
      style={{
        minWidth: geo.columnas * geo.cellSize + (geo.columnas - 1) * gap + 8,
        minHeight: geo.filas * geo.cellSize + (geo.filas - 1) * gap + 8,
      }}
    >
      <div
        className={styles.rejillaOrigen}
        style={{
          gridTemplateColumns: `repeat(${geo.columnas}, ${geo.cellSize}px)`,
          gridAutoRows: `${geo.cellSize}px`,
          gap,
        }}
      >
        {piezas.map((idx) => (
          <Pieza
            key={idx}
            index={idx}
            geo={geo}
            etiqueta={etiquetaPieza(idx)}
            disabled={bloqueado}
            arrastrando={activa === idPieza(idx)}
            elegida={elegida === idPieza(idx)}
            propsTocar={propsPieza(idx)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Viewer principal ──────────────────────────────────────────────────────────
export interface PuzzleImagenViewerProps {
  actividad: PuzzleImagenActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

interface CuerpoProps {
  actividad: PuzzleImagenActivity;
  estado: EstadoPuzzle;
  setEstado: React.Dispatch<React.SetStateAction<EstadoPuzzle>>;
  rango: number[];
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult) => void;
}

function Cuerpo({ actividad, estado, setEstado, rango, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, imagen } = actividad;
  const { filas, columnas, mostrarVista, dificultad } = configuracion;
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const [activo, setActivo] = useState<string | null>(null);
  const [cellSize, setCellSize] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const entrada = useModoEntrada();
  const tocar = entrada.modo === 'tocar';
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });
  const geo: Geometria = { filas, columnas, imagen, cellSize };

  const { origen, slots } = estado;
  const colocadas = slots.filter((s) => s !== null).length;
  useEffect(() => {
    setProgreso(colocadas);
  }, [colocadas, setProgreso]);

  // Borrador al montar y en cada cambio del tablero, mientras se juega.
  useEffect(() => {
    if (!jugando) return;
    responder(wrapActivityDraftResponse({ slots }));
  }, [slots, jugando, responder]);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const actualizar = () => {
      const rect = el.getBoundingClientRect();
      setCellSize(calcularTamanoCeldaPuzzle(rect.width, rect.height, filas, columnas, PUZZLE_IMAGEN_GAP_PX));
    };
    actualizar();
    const observador = new ResizeObserver(actualizar);
    observador.observe(el);
    return () => observador.disconnect();
  }, [filas, columnas]);

  /** Nombre hablado de una pieza: su número de reparto, que NO delata su casilla correcta. */
  const etiquetaPieza = useCallback((i: number) => `Pieza ${rango[i]! + 1}`, [rango]);

  const aplicar = useCallback(
    (id: string, destino: string) => {
      if (!jugando) return;
      setEstado((prev) => soltarPieza(prev, indiceDePieza(id), destino));
    },
    [jugando, setEstado],
  );

  const nombreZona = useCallback(
    (id: string) => (id === ID_ORIGEN ? 'las piezas sueltas' : `la casilla ${parseInt(id.replace('slot-', ''), 10) + 1}`),
    [],
  );
  const tocarColocar = useTocarColocar({
    onColocar: aplicar,
    etiquetaItem: (id) => etiquetaPieza(indiceDePieza(id)),
    etiquetaZona: nombreZona,
    deshabilitado: !tocar || !jugando,
  });

  const alSoltar = useCallback(
    (e: DragEndEvent) => {
      setActivo(null);
      if (!e.over) return;
      aplicar(e.active.id as string, e.over.id as string);
    },
    [aplicar],
  );

  const verificar = () => {
    if (!jugando || origen.length !== 0) return;
    const raw = { slots: [...slots] };
    const evaluada = evaluateActivityResponse('puzzle_imagen', actividad, raw);
    alEvaluar(evaluada);
    feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
    responder(raw);
    completar();
  };

  const verificado = !jugando && ctx.sesion.motivoFin !== 'sin_tiempo';
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const piezaActiva = activo ? indiceDePieza(activo) : null;
  const elegida = tocarColocar.seleccionado;
  const propsPieza = (i: number) => (tocar ? tocarColocar.propsItem(idPieza(i)) : undefined);

  /** En modo tocar, una casilla ocupada sin nada elegido selecciona su pieza; con algo elegido la recibe. */
  const propsCasilla = (pos: number): React.HTMLAttributes<HTMLElement> | undefined => {
    if (!tocar) return undefined;
    const base = tocarColocar.propsZona(idSlot(pos));
    const ocupante = slots[pos];
    if (ocupante === null || elegida !== null) return base;
    const item = tocarColocar.propsItem(idPieza(ocupante!));
    return { ...base, tabIndex: 0, 'aria-disabled': undefined, 'aria-pressed': false, onClick: item.onClick, onKeyDown: item.onKeyDown };
  };

  return (
    <div className={styles.raiz}>
      <div className={styles.cabecera}>
        {mostrarVista && dificultad !== 'dificil' ? (
          <div className={styles.referencia}>
            <span className={styles.rotulo}>Referencia:</span>
            <img src={imagen} alt="Referencia" className={styles.miniatura} />
          </div>
        ) : (
          <span />
        )}
        <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
      </div>

      <ActivityDndRoot
        arrastreActivo={!tocar}
        colisiones={COLISIONES}
        onDragStart={(e: DragStartEvent) => setActivo(e.active.id as string)}
        onDragEnd={alSoltar}
        overlay={
          piezaActiva !== null && cellSize > 0 ? (
            <div className={styles.fantasma} style={estiloPieza(piezaActiva, filas, columnas, imagen, cellSize)} />
          ) : null
        }
      >
        <div className={styles.zonas}>
          <div className={styles.columnaOrigen}>
            <span className={styles.rotuloFuerte}>Piezas</span>
            <div className={styles.contenedorOrigen}>
              <Origen
                geo={geo}
                piezas={origen}
                etiquetaPieza={etiquetaPieza}
                bloqueado={!jugando}
                activa={activo}
                elegida={elegida}
                propsTocar={tocar ? tocarColocar.propsZona(ID_ORIGEN) : undefined}
                propsPieza={propsPieza}
              />
            </div>
          </div>

          <div className={styles.columnaTablero}>
            <span className={styles.rotuloFuerte}>Armalo aquí</span>
            <div ref={areaRef} className={styles.contenedorTablero}>
              {cellSize > 0 && (
                <div
                  className={styles.tablero}
                  style={{
                    gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
                    gap: PUZZLE_IMAGEN_GAP_PX,
                  }}
                >
                  {slots.map((pieza, pos) => (
                    <Casilla
                      key={pos}
                      posicion={pos}
                      geo={geo}
                      piezaActual={pieza}
                      etiquetaPieza={etiquetaPieza}
                      esCorrecta={pieza === pos}
                      mostrarNumero={dificultad === 'facil'}
                      verificado={verificado}
                      elegida={pieza !== null && elegida === idPieza(pieza)}
                      propsTocar={propsCasilla(pos)}
                      bloqueada={!jugando}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ActivityDndRoot>
      <AnuncioTocarColocar anuncio={tocarColocar.anuncio} />

      {!verificado && (
        <button type="button" className={styles.verificar} onClick={verificar} disabled={!jugando || origen.length !== 0}>
          Verificar
        </button>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function PuzzleImagenViewer({ actividad, onResponse }: PuzzleImagenViewerProps) {
  const { configuracion, imagen } = actividad;
  const { filas, columnas } = configuracion;
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  const semilla = ajustes.semilla;
  const corrida = useRef(0);

  // `rango[i]` = posición de la pieza `i` en el reparto inicial (la usan los nombres hablados).
  const repartir = useCallback(() => {
    const orden = generarOrdenMezclado(filas, columnas, semilla, corrida.current);
    const rango: number[] = [];
    orden.forEach((pieza, k) => {
      rango[pieza] = k;
    });
    return { orden, rango };
  }, [filas, columnas, semilla]);

  const [reparto, setReparto] = useState(repartir);
  const [estado, setEstado] = useState<EstadoPuzzle>(() => estadoInicial(reparto.orden));
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const alReintentar = useCallback(() => {
    corrida.current += 1;
    const nuevo = repartir();
    setReparto(nuevo);
    setEstado(estadoInicial(nuevo.orden));
    setEvaluation(null);
  }, [repartir]);

  if (!imagen) {
    return <div className={styles.sinImagen}>Sin imagen configurada</div>;
  }

  return (
    <ActivityShell
      ajustes={ajustes}
      total={filas * columnas}
      evaluation={evaluation}
      onReintentar={alReintentar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          estado={estado}
          setEstado={setEstado}
          rango={reparto.rango}
          ctx={ctx}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  );
}
