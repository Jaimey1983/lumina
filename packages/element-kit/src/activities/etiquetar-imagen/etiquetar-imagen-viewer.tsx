'use client';

/**
 * Viewer de «Etiquetar imagen» (U16) sobre el `ActivityShell`.
 *
 * Una imagen con marcadores numerados (posicionados en % de la imagen, así sobreviven al zoom y al
 * redimensionado) y un banco de etiquetas debajo. Se arrastra una etiqueta a su marcador (ratón,
 * táctil o teclado) o se usa «tocar y colocar» (DU8). Un marcador admite UNA etiqueta: colocar otra
 * devuelve la anterior al banco. En «tocar y colocar», tocar un marcador ocupado (sin nada elegido)
 * devuelve su etiqueta al banco.
 *
 * Lo que sale por `onResponse` (DU2) es `[{ zonaId, etiquetaId }]` de los marcadores con etiqueta; si
 * se acaba el tiempo se envía lo colocado hasta ahí. La nota la calcula `@lumina/scoring`.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EtiquetarImagenActivity, EtiquetarImagenEtiqueta, EtiquetarImagenZona } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

import { colisionPorPuntero } from '../_shared/activity-colisiones.js';
import { ActivityDndRoot } from '../_shared/activity-dnd-root.js';
import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { AnuncioTocarColocar, ModoEntradaToggle } from '../_shared/activity-tap-place.js';
import { barajar } from '../_shared/barajar.js';
import {
  sinUbicarTodas,
  useContenedorSoltable,
  usePiezaArrastrable,
  useUbicarElementos,
  type Ubicaciones,
} from '../_shared/ubicar-elementos.js';
import { BANCO, etiquetarImagenFingerprint, normalizarEtiquetarImagen } from './etiquetar-imagen-config.js';
import styles from './etiquetar-imagen.module.css';

type EstadoZona = 'correcta' | 'incorrecta';

/** Soltar manda el puntero (no el área de la etiqueta): un marcador pequeño acierta a la primera. */
const COLISIONES = colisionPorPuntero();

/** Proporción de la imagen mientras no se conoce la real: el espacio queda reservado (sin saltos). */
const PROPORCION_INICIAL = 1.6;

export interface EtiquetarImagenViewerProps {
  actividad: EtiquetarImagenActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

// ── Etiqueta arrastrable ──────────────────────────────────────────────────────
function Etiqueta({
  etiqueta,
  estado,
  disabled,
  propsTocar,
  compacta,
}: {
  etiqueta: EtiquetarImagenEtiqueta;
  estado?: EstadoZona;
  disabled?: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
  compacta?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = usePiezaArrastrable(
    etiqueta.id,
    etiqueta.texto,
    disabled,
  );
  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  // El color solo no basta: el estado también se dice con palabras.
  const nombre = estado ? `${etiqueta.texto}, ${estado === 'correcta' ? 'correcto' : 'incorrecto'}` : undefined;
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      className={[
        styles.etiqueta,
        compacta ? styles.etiquetaEnMarcador : '',
        estado === 'correcta' ? styles.correcta : '',
        estado === 'incorrecta' ? styles.incorrecta : '',
        propsTocar?.['aria-pressed'] ? styles.elegida : '',
        disabled ? styles.bloqueada : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...listeners}
      {...attributes}
      {...propsTocar}
      aria-label={nombre}
    >
      {etiqueta.texto}
    </div>
  );
}

// ── Marcador sobre la imagen ──────────────────────────────────────────────────
function Marcador({
  zona,
  numero,
  ocupante,
  estado,
  bloqueado,
  propsTocar,
}: {
  zona: EtiquetarImagenZona;
  numero: number;
  ocupante?: EtiquetarImagenEtiqueta;
  estado?: EstadoZona;
  bloqueado: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
}) {
  const { setNodeRef, isOver } = useContenedorSoltable(zona.id, `Marcador ${numero}`);
  const estilo = { left: `${zona.x * 100}%`, top: `${zona.y * 100}%` } as CSSProperties;
  const resumen = ocupante ? `Marcador ${numero}: ${ocupante.texto}` : `Marcador ${numero}, vacío`;
  return (
    <div
      ref={setNodeRef}
      style={estilo}
      data-zona-id={zona.id}
      {...propsTocar}
      aria-label={propsTocar ? (propsTocar['aria-label'] ?? resumen) : undefined}
      className={[styles.marcador, isOver ? styles.marcadorSobre : ''].filter(Boolean).join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          styles.insignia,
          ocupante ? styles.insigniaLlena : '',
          estado === 'correcta' ? styles.correcta : '',
          estado === 'incorrecta' ? styles.incorrecta : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {numero}
      </span>
      {ocupante && (
        <Etiqueta etiqueta={ocupante} estado={estado} disabled={bloqueado} compacta />
      )}
    </div>
  );
}

// ── Banco de etiquetas ────────────────────────────────────────────────────────
function Banco({
  etiquetas,
  bloqueado,
  propsPieza,
}: {
  etiquetas: EtiquetarImagenEtiqueta[];
  bloqueado: boolean;
  propsPieza: (id: string) => React.HTMLAttributes<HTMLElement> | undefined;
}) {
  const { setNodeRef, isOver } = useContenedorSoltable(BANCO, 'banco de etiquetas');
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label="Banco de etiquetas"
      className={[styles.banco, isOver ? styles.bancoSobre : ''].filter(Boolean).join(' ')}
    >
      {etiquetas.map((e) => (
        <Etiqueta key={e.id} etiqueta={e} disabled={bloqueado} propsTocar={propsPieza(e.id)} />
      ))}
      {etiquetas.length === 0 && <span className={styles.bancoVacio}>Ya no quedan etiquetas.</span>}
    </div>
  );
}

// ── Cuerpo ────────────────────────────────────────────────────────────────────
interface CuerpoProps {
  act: EtiquetarImagenActivity;
  orden: EtiquetarImagenEtiqueta[];
  ubicaciones: Ubicaciones;
  setUbicaciones: React.Dispatch<React.SetStateAction<Ubicaciones>>;
  estados: Record<string, EstadoZona>;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult, estados: Record<string, EstadoZona>) => void;
}

function Cuerpo({ act, orden, ubicaciones, setUbicaciones, estados, ctx, responder, alEvaluar }: CuerpoProps) {
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });
  const emitidoEn = useRef<number | null>(null);

  const [proporcion, setProporcion] = useState(PROPORCION_INICIAL);
  const [cargada, setCargada] = useState<'cargando' | 'ok' | 'error'>(act.imagen ? 'cargando' : 'error');

  const numeroDe = useMemo(() => new Map(act.zonas.map((z, i) => [z.id, i + 1])), [act.zonas]);
  const colocadas = act.etiquetas.filter((e) => ubicaciones[e.id] != null);
  const enBanco = orden.filter((e) => ubicaciones[e.id] == null);
  const ocupanteDe = (zonaId: string) => act.etiquetas.find((e) => ubicaciones[e.id] === zonaId);

  /** Una etiqueta por marcador: la que ya estaba vuelve al banco. */
  const aplicar = useCallback(
    (etiquetaId: string, destino: string) => {
      if (!jugando) return;
      if (destino !== BANCO && !numeroDe.has(destino)) return;
      setUbicaciones((prev) => {
        const siguiente: Ubicaciones = { ...prev };
        if (destino !== BANCO) {
          for (const id of Object.keys(siguiente)) {
            if (siguiente[id] === destino) siguiente[id] = null;
          }
        }
        siguiente[etiquetaId] = destino === BANCO ? null : destino;
        return siguiente;
      });
    },
    [jugando, numeroDe, setUbicaciones],
  );

  const nombreContenedor = useCallback(
    (id: string) => (id === BANCO ? 'el banco de etiquetas' : `el marcador ${numeroDe.get(id) ?? ''}`.trim()),
    [numeroDe],
  );
  const ubicar = useUbicarElementos({
    bloqueado: !jugando,
    items: act.etiquetas,
    nombreContenedor,
    ubicados: colocadas.length,
    aplicar,
    setProgreso,
  });
  const { activo, entrada, tocar, tocarColocar, textoDe } = ubicar;

  const construirRespuesta = useCallback(
    () =>
      act.zonas.flatMap((z) => {
        const e = act.etiquetas.find((x) => ubicaciones[x.id] === z.id);
        return e ? [{ zonaId: z.id, etiquetaId: e.id }] : [];
      }),
    [act.zonas, act.etiquetas, ubicaciones],
  );

  const estadosDe = useCallback(
    (evaluada: ActivityEvaluationResult) => {
      const nuevos: Record<string, EstadoZona> = {};
      act.zonas.forEach((z, i) => {
        nuevos[z.id] = evaluada.details[i]?.correct ? 'correcta' : 'incorrecta';
      });
      return nuevos;
    },
    [act.zonas],
  );

  const comprobar = () => {
    if (!jugando || colocadas.length === 0) return;
    const raw = construirRespuesta();
    const evaluada = evaluateActivityResponse('etiquetar_imagen', act, raw);
    alEvaluar(evaluada, estadosDe(evaluada));
    feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
    responder(raw);
    completar();
  };

  // Se acabó el tiempo: se envía lo colocado hasta ese momento (una vez por corrida).
  useEffect(() => {
    if (ctx.sesion.motivoFin !== 'sin_tiempo' || emitidoEn.current === ctx.sesion.intento) return;
    emitidoEn.current = ctx.sesion.intento;
    const raw = construirRespuesta();
    const evaluada = evaluateActivityResponse('etiquetar_imagen', act, raw);
    alEvaluar(evaluada, estadosDe(evaluada));
    responder(raw);
  }, [ctx.sesion.motivoFin, ctx.sesion.intento, act, alEvaluar, construirRespuesta, estadosDe, responder]);

  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const verificado = !jugando && !sinTiempo && Object.keys(estados).length > 0;
  const arrastrada = activo ? textoDe(activo) : undefined;

  /** Tocar un marcador ocupado, sin nada elegido, devuelve su etiqueta al banco. */
  const propsMarcador = (zona: EtiquetarImagenZona, ocupante?: EtiquetarImagenEtiqueta) => {
    const base = ubicar.propsContenedor(zona.id);
    if (!base || !ocupante || tocarColocar.seleccionado !== null || !jugando) return base;
    const devolver = () => aplicar(ocupante.id, BANCO);
    return {
      ...base,
      tabIndex: 0,
      'aria-disabled': undefined,
      'aria-label': `Marcador ${numeroDe.get(zona.id)}: ${ocupante.texto}. Pulsa para devolverla al banco.`,
      onClick: devolver,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          devolver();
        }
      },
    };
  };

  return (
    <div className={styles.raiz}>
      {act.instruccion && <p className={styles.instruccion}>{act.instruccion}</p>}
      <div className={styles.herramientas}>
        <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
      </div>
      <ActivityDndRoot
        arrastreActivo={!tocar}
        colisiones={COLISIONES}
        onDragStart={ubicar.alEmpezar}
        onDragEnd={ubicar.alSoltar}
        overlay={arrastrada ? <div className={styles.fantasma}>{arrastrada}</div> : null}
      >
        <div className={styles.imagenCaja} style={{ aspectRatio: String(proporcion), '--proporcion': String(proporcion) } as CSSProperties}>
          {cargada !== 'error' && (
            // eslint-disable-next-line @next/next/no-img-element -- la URL la pone el docente; no pasa por el optimizador.
            <img
              src={act.imagen}
              alt={act.textoAlternativo}
              className={styles.imagen}
              draggable={false}
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                if (w > 0 && h > 0) setProporcion(w / h);
                setCargada('ok');
              }}
              onError={() => setCargada('error')}
            />
          )}
          {cargada === 'error' && (
            <p role="img" aria-label={act.textoAlternativo || 'Imagen'} className={styles.sinImagen}>
              {act.imagen ? 'No se pudo cargar la imagen.' : 'Esta actividad aún no tiene imagen.'}
              {act.textoAlternativo && <span className={styles.sinImagenTexto}>{act.textoAlternativo}</span>}
            </p>
          )}
          {act.zonas.map((z) => {
            const ocupante = ocupanteDe(z.id);
            return (
              <Marcador
                key={z.id}
                zona={z}
                numero={numeroDe.get(z.id) ?? 0}
                ocupante={ocupante}
                estado={verificado ? estados[z.id] : undefined}
                bloqueado={!jugando}
                propsTocar={propsMarcador(z, ocupante)}
              />
            );
          })}
        </div>
        <Banco etiquetas={enBanco} bloqueado={!jugando} propsPieza={ubicar.propsPieza} />
      </ActivityDndRoot>
      <AnuncioTocarColocar anuncio={tocarColocar.anuncio} />

      <div className={styles.acciones}>
        {jugando && (
          <button type="button" className={styles.comprobar} disabled={colocadas.length === 0} onClick={comprobar}>
            Comprobar
          </button>
        )}
        {verificado && (
          <p role="status" className={styles.estado}>
            Respuesta enviada.
          </p>
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

export function EtiquetarImagenViewer({ actividad, onResponse }: EtiquetarImagenViewerProps) {
  const act = useMemo(() => normalizarEtiquetarImagen(actividad), [actividad]);
  const huella = useMemo(() => etiquetarImagenFingerprint(act), [act]);
  const ajustes = useMemo(() => normalizarAjustes(act), [act]);
  const semilla = ajustes.semilla;
  const corrida = useRef(0);

  const [orden, setOrden] = useState(() => barajar(act.etiquetas, semilla, 0));
  const [ubicaciones, setUbicaciones] = useState<Ubicaciones>(() => sinUbicarTodas(act.etiquetas));
  const [estados, setEstados] = useState<Record<string, EstadoZona>>({});
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const reiniciar = useCallback(() => {
    corrida.current += 1;
    setOrden(barajar(act.etiquetas, semilla, corrida.current));
    setUbicaciones(sinUbicarTodas(act.etiquetas));
    setEstados({});
    setEvaluation(null);
  }, [act.etiquetas, semilla]);

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
      total={act.zonas.length}
      evaluation={evaluation}
      onReintentar={reiniciar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          act={act}
          orden={orden}
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
