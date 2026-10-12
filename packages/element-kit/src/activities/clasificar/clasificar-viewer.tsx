'use client';

/**
 * Viewer de Clasificar sobre el `ActivityShell` (U9b.2).
 *
 * El shell aporta fases, cronómetro, progreso y la pantalla de resultados; el viewer solo
 * lleva dónde está cada pieza. Lo que sale hacia `@lumina/scoring` NO cambió: una respuesta
 * `{ ubicaciones }` al verificar. Sale por `onResponse` (canal unificado, DU2). Se puede arrastrar (ratón, táctil o teclado) o usar
 * «tocar y colocar» (DU8).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { ClasificarActivity, ClasificarItem } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

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
import { barajar } from '../_shared/barajar.js';
import styles from './clasificar.module.css';

const SIN_CLASIFICAR = 'sin-clasificar';
type EstadoItem = 'correcto' | 'incorrecto' | null;

// ── Pieza arrastrable ─────────────────────────────────────────────────────────
function PiezaArrastrable({
  item,
  estado,
  disabled,
  propsTocar,
}: {
  item: ClasificarItem;
  estado?: EstadoItem;
  disabled?: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
    // El nombre que oyen los lectores de pantalla al arrastrar con teclado.
    data: { etiqueta: item.texto },
    attributes: { roleDescription: 'elemento arrastrable' },
  });

  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  // El color solo no basta: el estado también se dice con palabras.
  const nombre = estado ? `${item.texto}, ${estado}` : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      className={[
        styles.pieza,
        estado === 'correcto' ? styles.piezaCorrecta : '',
        estado === 'incorrecto' ? styles.piezaIncorrecta : '',
        propsTocar?.['aria-pressed'] ? styles.piezaElegida : '',
        disabled ? styles.piezaBloqueada : '',
      ].join(' ')}
      {...listeners}
      {...attributes}
      {...propsTocar}
      aria-label={nombre}
    >
      {item.texto}
    </div>
  );
}

// ── Columna (categoría o área de origen) ──────────────────────────────────────
interface ColumnaProps {
  id: string;
  nombre: string;
  /** Color de la categoría (dato guardado en el slide); sin él, la columna es neutra. */
  color?: string;
  items: ClasificarItem[];
  estados: Record<string, EstadoItem>;
  bloqueado: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
  propsPieza: (id: string) => React.HTMLAttributes<HTMLElement> | undefined;
}

function Columna({ id, nombre, color, items, estados, bloqueado, propsTocar, propsPieza }: ColumnaProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { etiqueta: nombre } });
  const estilo = color ? ({ '--color-categoria': color } as CSSProperties) : undefined;
  return (
    <div
      ref={setNodeRef}
      style={estilo}
      {...propsTocar}
      aria-label={propsTocar ? nombre : undefined}
      className={[styles.columna, color ? '' : styles.columnaNeutra, isOver ? styles.columnaSobre : ''].join(' ')}
    >
      <div className={styles.encabezado}>{nombre}</div>
      <div className={styles.lista}>
        {items.map((item) => (
          <PiezaArrastrable
            key={item.id}
            item={item}
            estado={bloqueado ? estados[item.id] : null}
            disabled={bloqueado}
            propsTocar={propsPieza(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Viewer principal ──────────────────────────────────────────────────────────
export interface ClasificarViewerProps {
  actividad: ClasificarActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

interface CuerpoProps {
  actividad: ClasificarActivity;
  piezas: ClasificarItem[];
  ubicaciones: Record<string, string | null>;
  setUbicaciones: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  estados: Record<string, EstadoItem>;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult, estados: Record<string, EstadoItem>) => void;
}

function Cuerpo({ actividad, piezas, ubicaciones, setUbicaciones, estados, ctx, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, categorias, items } = actividad;
  const colores = configuracion.colorCategorias;
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const [activo, setActivo] = useState<string | null>(null);
  const entrada = useModoEntrada();
  const tocar = entrada.modo === 'tocar';
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });

  const sinClasificar = piezas.filter((i) => ubicaciones[i.id] === null);
  const todoClasificado = sinClasificar.length === 0;

  // El encabezado del shell cuenta las piezas ya colocadas.
  const colocadas = items.length - sinClasificar.length;
  useEffect(() => {
    setProgreso(colocadas);
  }, [colocadas, setProgreso]);

  const aplicar = useCallback(
    (itemId: string, destino: string) => {
      if (!jugando) return;
      setUbicaciones((prev) => ({ ...prev, [itemId]: destino === SIN_CLASIFICAR ? null : destino }));
    },
    [jugando, setUbicaciones],
  );

  const textoDe = useCallback((id: string) => items.find((i) => i.id === id)?.texto, [items]);
  const nombreZona = useCallback(
    (id: string) =>
      id === SIN_CLASIFICAR ? 'elementos para clasificar' : categorias.find((c) => c.id === id)?.nombre,
    [categorias],
  );
  const tocarColocar = useTocarColocar({
    onColocar: aplicar,
    etiquetaItem: textoDe,
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
    if (!jugando || !todoClasificado) return;
    const raw = { ubicaciones: { ...ubicaciones } };
    const evaluada = evaluateActivityResponse('clasificar', actividad, raw);
    const nuevos: Record<string, EstadoItem> = {};
    items.forEach((item, i) => {
      nuevos[item.id] = evaluada.details[i]?.correct ? 'correcto' : 'incorrecto';
    });
    alEvaluar(evaluada, nuevos);
    feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
    responder(raw);
    completar();
  };

  const arrastrada = activo ? textoDe(activo) : undefined;
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const verificado = !jugando && !sinTiempo;
  const propsPieza = (id: string) => (tocar ? tocarColocar.propsItem(id) : undefined);

  return (
    <div className={styles.raiz}>
      <div className={styles.herramientas}>
        <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
      </div>
      {/* El DndContext envuelve TODA la zona interactiva: el área de origen y las categorías. */}
      <ActivityDndRoot
        arrastreActivo={!tocar}
        onDragStart={(e: DragStartEvent) => setActivo(e.active.id as string)}
        onDragEnd={alSoltar}
        overlay={arrastrada ? <div className={styles.fantasma}>{arrastrada}</div> : null}
      >
        {!verificado && (
          <Columna
            id={SIN_CLASIFICAR}
            nombre="Elementos para clasificar"
            items={sinClasificar}
            estados={{}}
            bloqueado={!jugando}
            propsTocar={tocar ? tocarColocar.propsZona(SIN_CLASIFICAR) : undefined}
            propsPieza={propsPieza}
          />
        )}

        <div className={styles.rejilla} style={{ gridTemplateColumns: `repeat(${configuracion.columnas}, 1fr)` }}>
          {categorias.map((cat, idx) => (
            <Columna
              key={cat.id}
              id={cat.id}
              nombre={cat.nombre}
              color={colores[idx % colores.length]}
              items={piezas.filter((i) => ubicaciones[i.id] === cat.id)}
              estados={estados}
              bloqueado={!jugando}
              propsTocar={tocar ? tocarColocar.propsZona(cat.id) : undefined}
              propsPieza={propsPieza}
            />
          ))}
        </div>
      </ActivityDndRoot>
      <AnuncioTocarColocar anuncio={tocarColocar.anuncio} />

      {!verificado && (
        <button type="button" className={styles.verificar} onClick={verificar} disabled={!jugando || !todoClasificado}>
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

export function ClasificarViewer({ actividad, onResponse }: ClasificarViewerProps) {
  const { items } = actividad;
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  const semilla = ajustes.semilla;
  const corrida = useRef(0);

  const vacias = useCallback(() => Object.fromEntries(items.map((i) => [i.id, null])) as Record<string, string | null>, [items]);
  // Orden de las piezas: aleatorio por alumno o, con semilla, el mismo para toda la clase.
  const [piezas, setPiezas] = useState(() => barajar(items, semilla, 0));
  const [ubicaciones, setUbicaciones] = useState<Record<string, string | null>>(vacias);
  const [estados, setEstados] = useState<Record<string, EstadoItem>>({});
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const alReintentar = useCallback(() => {
    corrida.current += 1;
    setPiezas(barajar(items, semilla, corrida.current));
    setUbicaciones(vacias());
    setEstados({});
    setEvaluation(null);
  }, [items, semilla, vacias]);

  return (
    <ActivityShell
      ajustes={ajustes}
      total={items.length}
      evaluation={evaluation}
      onReintentar={alReintentar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          piezas={piezas}
          ubicaciones={ubicaciones}
          setUbicaciones={setUbicaciones}
          estados={estados}
          ctx={ctx}
          responder={responder}
          alEvaluar={(e, nuevos) => {
            setEvaluation(e);
            setEstados(nuevos);
          }}
        />
      )}
    </ActivityShell>
  );
}
