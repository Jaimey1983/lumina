'use client';

/**
 * Viewer de «Relacionar con líneas» (U14) sobre el `ActivityShell`.
 *
 * Dos columnas: el alumno traza una línea de un elemento de la izquierda a uno de la derecha.
 * Se puede ARRASTRAR desde la izquierda hasta la derecha, o por teclado/toque: elegir la izquierda
 * y luego su pareja (Escape cancela; volver a tocar una izquierda ya conectada quita su línea). La
 * respuesta que sale por `onResponse` es la de `emparejar`: `[{ leftId, rightId }]` en el orden en
 * que se trazaron. Las líneas se miden con `offsetLeft/offsetTop` (no con rectángulos de pantalla)
 * para que sigan bien bajo el zoom y el recorte del lienzo del editor.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { RelacionarLineasActivity, RelacionarLineasItem } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { AnuncioTocarColocar } from '../_shared/activity-tap-place.js';
import { barajar } from '../_shared/barajar.js';
import { etiquetaItem, normalizarRelacionarLineas, relacionarLineasFingerprint } from './relacionar-lineas-config.js';
import styles from './relacionar-lineas.module.css';

interface Linea {
  leftId: string;
  rightId: string;
}
type EstadoLinea = 'correcta' | 'incorrecta';
interface Punto {
  x: number;
  y: number;
}

const UMBRAL_ARRASTRE_PX = 6;

function Contenido({ item }: { item: RelacionarLineasItem }) {
  if (item.imagen) {
    return <img src={item.imagen} alt={item.texto ?? ''} className={styles.imagen} draggable={false} />;
  }
  return <span>{item.texto}</span>;
}

/** Camino curvo de un punto a otro (las líneas "respiran" mejor que las rectas cruzadas). */
function camino(a: Punto, b: Punto): string {
  const dx = Math.max(24, Math.abs(b.x - a.x) / 2);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

export interface RelacionarLineasViewerProps {
  actividad: RelacionarLineasActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

interface CuerpoProps {
  act: RelacionarLineasActivity;
  izquierda: RelacionarLineasItem[];
  derecha: RelacionarLineasItem[];
  lineas: Linea[];
  setLineas: React.Dispatch<React.SetStateAction<Linea[]>>;
  estados: Record<string, EstadoLinea>;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult, estados: Record<string, EstadoLinea>) => void;
}

function Cuerpo({ act, izquierda, derecha, lineas, setLineas, estados, ctx, responder, alEvaluar }: CuerpoProps) {
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });

  const [elegido, setElegido] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const [arrastre, setArrastre] = useState<{ leftId: string; cursor: Punto } | null>(null);
  const [puntos, setPuntos] = useState<Record<string, Punto>>({});

  const lienzoRef = useRef<HTMLDivElement>(null);
  const nodos = useRef(new Map<string, HTMLElement>());
  const huboArrastre = useRef(false);

  const nombreDe = useCallback(
    (lado: 'izq' | 'der', id: string) => {
      const lista = lado === 'izq' ? izquierda : derecha;
      const it = lista.find((x) => x.id === id);
      return it ? etiquetaItem(it) || 'elemento' : 'elemento';
    },
    [izquierda, derecha],
  );

  useEffect(() => {
    setProgreso(lineas.length);
  }, [lineas.length, setProgreso]);

  // ── Geometría: dónde se anclan las líneas, medido contra el lienzo ──
  const medir = useCallback(() => {
    const sig: Record<string, Punto> = {};
    nodos.current.forEach((el, clave) => {
      const esIzq = clave.startsWith('izq:');
      sig[clave] = {
        x: esIzq ? el.offsetLeft + el.offsetWidth : el.offsetLeft,
        y: el.offsetTop + el.offsetHeight / 2,
      };
    });
    setPuntos((prev) => {
      const claves = Object.keys(sig);
      const igual =
        claves.length === Object.keys(prev).length &&
        claves.every((k) => prev[k] && prev[k]!.x === sig[k]!.x && prev[k]!.y === sig[k]!.y);
      return igual ? prev : sig;
    });
  }, []);

  useLayoutEffect(() => {
    medir();
  }, [medir, izquierda, derecha, lineas.length]);

  useEffect(() => {
    const el = lienzoRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => medir());
    obs.observe(el);
    return () => obs.disconnect();
  }, [medir]);

  const registrar = (clave: string) => (el: HTMLElement | null) => {
    if (el) nodos.current.set(clave, el);
    else nodos.current.delete(clave);
  };

  // ── Acciones ──
  const conectar = useCallback(
    (leftId: string, rightId: string) => {
      setLineas((prev) => [...prev.filter((l) => l.leftId !== leftId), { leftId, rightId }]);
      setAnuncio(`Uniste ${nombreDe('izq', leftId)} con ${nombreDe('der', rightId)}.`);
      setElegido(null);
    },
    [nombreDe, setLineas],
  );

  const alTocarIzquierda = (id: string) => {
    if (!jugando) return;
    if (huboArrastre.current) {
      huboArrastre.current = false;
      return;
    }
    if (elegido !== id && lineas.some((l) => l.leftId === id)) {
      setLineas((prev) => prev.filter((l) => l.leftId !== id));
      setAnuncio(`Quitaste la línea de ${nombreDe('izq', id)}.`);
      return;
    }
    if (elegido === id) {
      setElegido(null);
      setAnuncio(`Cancelaste la elección de ${nombreDe('izq', id)}.`);
    } else {
      setElegido(id);
      setAnuncio(`Elegiste ${nombreDe('izq', id)}. Ahora elige su pareja en la columna de la derecha.`);
    }
  };

  const alTocarDerecha = (id: string) => {
    if (!jugando || !elegido) return;
    conectar(elegido, id);
  };

  const alTeclear = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && elegido) {
      setAnuncio(`Cancelaste la elección de ${nombreDe('izq', elegido)}.`);
      setElegido(null);
    }
  };

  // ── Arrastre con puntero (ratón, lápiz, táctil) ──
  const cursorEn = (clientX: number, clientY: number): Punto => {
    const el = lienzoRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    // Bajo un `transform: scale` el rectángulo de pantalla es más grande/chico que el layout.
    const k = el.offsetWidth > 0 && r.width > 0 ? r.width / el.offsetWidth : 1;
    return { x: (clientX - r.left) / k, y: (clientY - r.top) / k };
  };

  const alBajarIzquierda = (e: ReactPointerEvent, leftId: string) => {
    if (!jugando || e.button > 0) return;
    huboArrastre.current = false;
    const inicio = { x: e.clientX, y: e.clientY };
    let movido = false;
    const mover = (ev: PointerEvent) => {
      if (!movido && Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) < UMBRAL_ARRASTRE_PX) return;
      movido = true;
      setArrastre({ leftId, cursor: cursorEn(ev.clientX, ev.clientY) });
    };
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      setArrastre(null);
      if (!movido) return;
      // El `click` que sigue a un arrastre (si el navegador lo manda) no debe contar como toque.
      huboArrastre.current = true;
      setTimeout(() => {
        huboArrastre.current = false;
      }, 0);
      const bajo = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
      const destino = (bajo as HTMLElement | null)?.closest?.('[data-derecha-id]') as HTMLElement | null;
      const rightId = destino?.getAttribute('data-derecha-id');
      if (rightId) conectar(leftId, rightId);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  };

  // ── Comprobar ──
  const comprobar = () => {
    if (!jugando || lineas.length === 0) return;
    const raw = lineas.map((l) => ({ leftId: l.leftId, rightId: l.rightId }));
    const evaluada = evaluateActivityResponse('relacionar_lineas', act, raw);
    const esperadas = new Map(act.relaciones.map((r) => [r.izquierdaId, r.derechaId]));
    const nuevos: Record<string, EstadoLinea> = {};
    for (const l of lineas) nuevos[l.leftId] = esperadas.get(l.leftId) === l.rightId ? 'correcta' : 'incorrecta';
    alEvaluar(evaluada, nuevos);
    feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
    responder(raw);
    completar();
  };

  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const verificado = !jugando && !sinTiempo && Object.keys(estados).length > 0;
  const lineaDe = (leftId: string) => lineas.find((l) => l.leftId === leftId);
  const derechasUsadas = new Set(lineas.map((l) => l.rightId));

  return (
    <div className={styles.tarjeta} onKeyDown={alTeclear}>
      {act.instruccion && <p className={styles.instruccion}>{act.instruccion}</p>}
      <p className={styles.ayuda}>Arrastra desde la izquierda hasta su pareja, o elige uno de cada lado.</p>

      <div className={styles.lienzo} ref={lienzoRef}>
        <div className={styles.columna} role="group" aria-label="Columna izquierda">
          {izquierda.map((it) => {
            const linea = lineaDe(it.id);
            const estado = estados[it.id];
            const nombre = etiquetaItem(it) || 'elemento';
            const etiqueta = linea
              ? `${nombre}, unido con ${nombreDe('der', linea.rightId)}${
                  estado ? `, ${estado === 'correcta' ? 'correcto' : 'incorrecto'}` : '. Pulsa para quitar la línea.'
                }`
              : undefined;
            return (
              <button
                key={it.id}
                ref={registrar(`izq:${it.id}`)}
                type="button"
                data-izquierda-id={it.id}
                aria-pressed={linea ? undefined : elegido === it.id}
                aria-label={etiqueta}
                disabled={!jugando}
                onClick={() => alTocarIzquierda(it.id)}
                onPointerDown={(e) => alBajarIzquierda(e, it.id)}
                className={[
                  styles.nodo,
                  styles.nodoIzquierdo,
                  it.imagen ? styles.conImagen : '',
                  elegido === it.id ? styles.elegido : linea && !estado ? styles.conectado : '',
                  estado === 'correcta' ? styles.correcto : estado === 'incorrecta' ? styles.incorrecto : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Contenido item={it} />
              </button>
            );
          })}
        </div>

        <div className={styles.huecoCentral} aria-hidden />

        <div className={styles.columna} role="group" aria-label="Columna derecha">
          {derecha.map((it) => {
            const usado = derechasUsadas.has(it.id);
            const nombre = etiquetaItem(it) || 'elemento';
            return (
              <button
                key={it.id}
                ref={registrar(`der:${it.id}`)}
                type="button"
                data-derecha-id={it.id}
                aria-label={usado ? `${nombre}, con una línea` : undefined}
                aria-disabled={!elegido || undefined}
                disabled={!jugando}
                onClick={() => alTocarDerecha(it.id)}
                className={[styles.nodo, it.imagen ? styles.conImagen : '', usado ? styles.conectado : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <Contenido item={it} />
              </button>
            );
          })}
        </div>

        <svg className={styles.lineas} aria-hidden="true" focusable="false">
          {lineas.map((l) => {
            const a = puntos[`izq:${l.leftId}`];
            const b = puntos[`der:${l.rightId}`];
            if (!a || !b) return null;
            const estado = estados[l.leftId];
            return (
              <g key={l.leftId} data-linea={l.leftId} data-estado={estado ?? 'trazada'}>
                <path
                  d={camino(a, b)}
                  className={[
                    styles.linea,
                    estado === 'correcta' ? styles.lineaCorrecta : estado === 'incorrecta' ? styles.lineaIncorrecta : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                <circle cx={a.x} cy={a.y} r={4} className={styles.punta} />
                <circle cx={b.x} cy={b.y} r={4} className={styles.punta} />
              </g>
            );
          })}
          {arrastre && puntos[`izq:${arrastre.leftId}`] && (
            <path data-arrastre d={camino(puntos[`izq:${arrastre.leftId}`]!, arrastre.cursor)} className={styles.lineaArrastre} />
          )}
        </svg>
      </div>

      <AnuncioTocarColocar anuncio={anuncio} />

      <div className={styles.acciones}>
        {jugando && (
          <button type="button" className={styles.comprobar} disabled={lineas.length === 0} onClick={comprobar}>
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

export function RelacionarLineasViewer({ actividad, onResponse }: RelacionarLineasViewerProps) {
  const act = useMemo(() => normalizarRelacionarLineas(actividad), [actividad]);
  const huella = useMemo(() => relacionarLineasFingerprint(act), [act]);
  const ajustes = useMemo(() => normalizarAjustes(act), [act]);
  const semilla = ajustes.semilla;
  const corrida = useRef(0);

  const [izquierda, setIzquierda] = useState(() => barajar(act.izquierda, semilla, 0));
  const [derecha, setDerecha] = useState(() => barajar(act.derecha, semilla, 1));
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoLinea>>({});
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const reiniciar = useCallback(() => {
    corrida.current += 1;
    setIzquierda(barajar(act.izquierda, semilla, corrida.current * 2));
    setDerecha(barajar(act.derecha, semilla, corrida.current * 2 + 1));
    setLineas([]);
    setEstados({});
    setEvaluation(null);
  }, [act.izquierda, act.derecha, semilla]);

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
      total={act.relaciones.length}
      evaluation={evaluation}
      onReintentar={reiniciar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          act={act}
          izquierda={izquierda}
          derecha={derecha}
          lineas={lineas}
          setLineas={setLineas}
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
