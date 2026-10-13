'use client';

/**
 * Viewer de «Cloze con banco» (U18) sobre el `ActivityShell`.
 *
 * Un texto con huecos y un banco de palabras (las respuestas más los distractores) debajo. Se arrastra
 * una palabra a su hueco (ratón, táctil o teclado) o se usa «tocar y colocar» (DU8). Un hueco admite
 * UNA palabra: colocar otra devuelve la anterior al banco; la palabra colocada sale del banco. En
 * «tocar y colocar», tocar un hueco ocupado (sin nada elegido) devuelve su palabra al banco.
 *
 * Lo que sale por `onResponse` (DU2) es `Record<idHueco, palabra>` (la forma de `completar_blancos`)
 * con los huecos llenos; si se acaba el tiempo se envía lo colocado hasta ahí. La nota la calcula
 * `@lumina/scoring`.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ClozeBancoActivity } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

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
import {
  BANCO,
  clozeBancoFingerprint,
  fichasDelBanco,
  normalizarClozeBanco,
  segmentarTexto,
  type Ficha,
} from './cloze-banco-config.js';
import styles from './cloze-banco.module.css';

type EstadoHueco = 'correcta' | 'incorrecta';

export interface ClozeBancoViewerProps {
  actividad: ClozeBancoActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

// ── Palabra del banco (arrastrable) ───────────────────────────────────────────
function Palabra({
  ficha,
  estado,
  disabled,
  propsTocar,
  enHueco,
}: {
  ficha: Ficha;
  estado?: EstadoHueco;
  disabled?: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
  enHueco?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = usePiezaArrastrable(
    ficha.id,
    ficha.texto,
    disabled,
  );
  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  // El color solo no basta: el estado también se dice con palabras.
  const nombre = estado ? `${ficha.texto}, ${estado === 'correcta' ? 'correcto' : 'incorrecto'}` : undefined;
  return (
    <span
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      className={[
        styles.palabra,
        enHueco ? styles.palabraEnHueco : '',
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
      {ficha.texto}
    </span>
  );
}

// ── Hueco en el texto ─────────────────────────────────────────────────────────
function Hueco({
  id,
  numero,
  ocupante,
  estado,
  bloqueado,
  propsTocar,
}: {
  id: string;
  numero: number;
  ocupante?: Ficha;
  estado?: EstadoHueco;
  bloqueado: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
}) {
  const { setNodeRef, isOver } = useContenedorSoltable(id, `Hueco ${numero}`);
  const resumen = ocupante ? `Hueco ${numero}: ${ocupante.texto}` : `Hueco ${numero}, vacío`;
  return (
    <span
      ref={setNodeRef}
      data-hueco-id={id}
      {...propsTocar}
      aria-label={propsTocar ? (propsTocar['aria-label'] ?? resumen) : undefined}
      className={[styles.hueco, ocupante ? styles.huecoLleno : '', isOver ? styles.huecoSobre : '']
        .filter(Boolean)
        .join(' ')}
    >
      {ocupante ? (
        <Palabra ficha={ocupante} estado={estado} disabled={bloqueado} enHueco />
      ) : (
        <span aria-hidden="true" className={styles.numeroHueco}>
          {numero}
        </span>
      )}
    </span>
  );
}

// ── Banco ─────────────────────────────────────────────────────────────────────
function Banco({
  fichas,
  bloqueado,
  propsPieza,
}: {
  fichas: Ficha[];
  bloqueado: boolean;
  propsPieza: (id: string) => React.HTMLAttributes<HTMLElement> | undefined;
}) {
  const { setNodeRef, isOver } = useContenedorSoltable(BANCO, 'banco de palabras');
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label="Banco de palabras"
      className={[styles.banco, isOver ? styles.bancoSobre : ''].filter(Boolean).join(' ')}
    >
      {fichas.map((f) => (
        <Palabra key={f.id} ficha={f} disabled={bloqueado} propsTocar={propsPieza(f.id)} />
      ))}
      {fichas.length === 0 && <span className={styles.bancoVacio}>Ya no quedan palabras.</span>}
    </div>
  );
}

// ── Cuerpo ────────────────────────────────────────────────────────────────────
interface CuerpoProps {
  act: ClozeBancoActivity;
  fichas: Ficha[];
  orden: Ficha[];
  ubicaciones: Ubicaciones;
  setUbicaciones: React.Dispatch<React.SetStateAction<Ubicaciones>>;
  estados: Record<string, EstadoHueco>;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult, estados: Record<string, EstadoHueco>) => void;
}

function Cuerpo({ act, fichas, orden, ubicaciones, setUbicaciones, estados, ctx, responder, alEvaluar }: CuerpoProps) {
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });
  const emitidoEn = useRef<number | null>(null);

  const idsHuecos = useMemo(() => new Set(act.blancos.map((b) => b.id)), [act.blancos]);
  const numeroDe = useMemo(() => new Map(act.blancos.map((b, i) => [b.id, i + 1])), [act.blancos]);
  const partes = useMemo(() => segmentarTexto(act.texto, idsHuecos), [act.texto, idsHuecos]);

  const colocadas = fichas.filter((f) => ubicaciones[f.id] != null);
  const enBanco = orden.filter((f) => ubicaciones[f.id] == null);
  const ocupanteDe = (huecoId: string) => fichas.find((f) => ubicaciones[f.id] === huecoId);

  /** Una palabra por hueco: la que ya estaba vuelve al banco. */
  const aplicar = useCallback(
    (fichaId: string, destino: string) => {
      if (!jugando) return;
      if (destino !== BANCO && !idsHuecos.has(destino)) return;
      setUbicaciones((prev) => {
        const siguiente: Ubicaciones = { ...prev };
        if (destino !== BANCO) {
          for (const id of Object.keys(siguiente)) {
            if (siguiente[id] === destino) siguiente[id] = null;
          }
        }
        siguiente[fichaId] = destino === BANCO ? null : destino;
        return siguiente;
      });
    },
    [jugando, idsHuecos, setUbicaciones],
  );

  const nombreContenedor = useCallback(
    (id: string) => (id === BANCO ? 'el banco de palabras' : `el hueco ${numeroDe.get(id) ?? ''}`.trim()),
    [numeroDe],
  );
  const ubicar = useUbicarElementos({
    bloqueado: !jugando,
    items: fichas,
    nombreContenedor,
    ubicados: colocadas.length,
    aplicar,
    setProgreso,
  });
  const { activo, entrada, tocar, tocarColocar, textoDe } = ubicar;

  const construirRespuesta = useCallback(() => {
    const r: Record<string, string> = {};
    for (const b of act.blancos) {
      const f = fichas.find((x) => ubicaciones[x.id] === b.id);
      if (f) r[b.id] = f.texto;
    }
    return r;
  }, [act.blancos, fichas, ubicaciones]);

  const estadosDe = useCallback(
    (evaluada: ActivityEvaluationResult) => {
      const nuevos: Record<string, EstadoHueco> = {};
      act.blancos.forEach((b, i) => {
        nuevos[b.id] = evaluada.details[i]?.correct ? 'correcta' : 'incorrecta';
      });
      return nuevos;
    },
    [act.blancos],
  );

  const comprobar = () => {
    if (!jugando || colocadas.length === 0) return;
    const raw = construirRespuesta();
    const evaluada = evaluateActivityResponse('cloze_banco', act, raw);
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
    const evaluada = evaluateActivityResponse('cloze_banco', act, raw);
    alEvaluar(evaluada, estadosDe(evaluada));
    responder(raw);
  }, [ctx.sesion.motivoFin, ctx.sesion.intento, act, alEvaluar, construirRespuesta, estadosDe, responder]);

  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const verificado = !jugando && !sinTiempo && Object.keys(estados).length > 0;
  const arrastrada = activo ? textoDe(activo) : undefined;

  /** Tocar un hueco ocupado, sin nada elegido, devuelve su palabra al banco. */
  const propsHueco = (huecoId: string, ocupante?: Ficha) => {
    const base = ubicar.propsContenedor(huecoId);
    if (!base || !ocupante || tocarColocar.seleccionado !== null || !jugando) return base;
    const devolver = () => aplicar(ocupante.id, BANCO);
    return {
      ...base,
      tabIndex: 0,
      'aria-disabled': undefined,
      'aria-label': `Hueco ${numeroDe.get(huecoId)}: ${ocupante.texto}. Pulsa para devolverla al banco.`,
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
      <div className={styles.herramientas}>
        <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
      </div>
      <ActivityDndRoot
        arrastreActivo={!tocar}
        onDragStart={ubicar.alEmpezar}
        onDragEnd={ubicar.alSoltar}
        overlay={arrastrada ? <div className={styles.fantasma}>{arrastrada}</div> : null}
      >
        <p className={styles.texto}>
          {partes.map((p, i) =>
            p.tipo === 'texto' ? (
              <span key={i}>{p.texto}</span>
            ) : (
              <Hueco
                key={i}
                id={p.id}
                numero={numeroDe.get(p.id) ?? 0}
                ocupante={ocupanteDe(p.id)}
                estado={verificado ? estados[p.id] : undefined}
                bloqueado={!jugando}
                propsTocar={propsHueco(p.id, ocupanteDe(p.id))}
              />
            ),
          )}
        </p>
        <Banco fichas={enBanco} bloqueado={!jugando} propsPieza={ubicar.propsPieza} />
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

export function ClozeBancoViewer({ actividad, onResponse }: ClozeBancoViewerProps) {
  const act = useMemo(() => normalizarClozeBanco(actividad), [actividad]);
  const huella = useMemo(() => clozeBancoFingerprint(act), [act]);
  const ajustes = useMemo(() => normalizarAjustes(act), [act]);
  const semilla = ajustes.semilla;
  const corrida = useRef(0);
  const fichas = useMemo(() => fichasDelBanco(act), [act]);

  const [orden, setOrden] = useState(() => barajar(fichas, semilla, 0));
  const [ubicaciones, setUbicaciones] = useState<Ubicaciones>(() => sinUbicarTodas(fichas));
  const [estados, setEstados] = useState<Record<string, EstadoHueco>>({});
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const reiniciar = useCallback(() => {
    corrida.current += 1;
    setOrden(barajar(fichas, semilla, corrida.current));
    setUbicaciones(sinUbicarTodas(fichas));
    setEstados({});
    setEvaluation(null);
  }, [fichas, semilla]);

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
      total={act.blancos.length}
      evaluation={evaluation}
      onReintentar={reiniciar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          act={act}
          fichas={fichas}
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
