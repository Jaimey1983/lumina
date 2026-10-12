'use client';

/**
 * Viewer de Sopa de letras sobre el `ActivityShell` (U9c.4).
 *
 * El shell aporta fases, cronómetro, progreso y la pantalla de resultados. Lo que sale hacia
 * `@lumina/scoring` NO cambió: UNA respuesta `{ encontradas }` al hallar la última palabra, sin
 * borradores; sale por `onResponse` (canal unificado, DU2) y `onComplete` se acepta solo como
 * alias transitorio. Si se agota el tiempo sale lo hallado hasta ese momento.
 *
 * Se selecciona arrastrando (ratón o dedo) o con el teclado (DU8): las flechas mueven una sola
 * celda del orden de tabulación; Enter/Espacio fija el inicio, las flechas estiran la línea y
 * Enter la confirma (Escape la cancela). Cada hallazgo se anuncia por `aria-live`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SopaLetrasActivity } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { generarGrid, seleccionEsPalabra, type PalabraColocada } from './sopa-letras-config.js';
import { SOPA_LETRAS_GAP_PX, tamanoFuenteCeldaSopa, useSopaGridCellSize } from './sopa-letras-shared.js';
import styles from './sopa-letras.module.css';

export interface SopaLetrasViewerProps {
  actividad: SopaLetrasActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void;
}

interface Celda {
  fila: number;
  columna: number;
}

const TECLA_A_PASO: Record<string, Celda> = {
  ArrowUp: { fila: -1, columna: 0 },
  ArrowDown: { fila: 1, columna: 0 },
  ArrowLeft: { fila: 0, columna: -1 },
  ArrowRight: { fila: 0, columna: 1 },
};
/** Cuántos tintes distintos se alternan entre palabras halladas (`styles.hallada0…2`). */
const TINTES = 3;

function celdasEnLinea(inicio: Celda, fin: Celda): Celda[] {
  const df = fin.fila - inicio.fila;
  const dc = fin.columna - inicio.columna;
  const esHorizontal = df === 0 && dc !== 0;
  const esVertical = dc === 0 && df !== 0;
  const esDiagonal = Math.abs(df) === Math.abs(dc) && df !== 0;
  if (!esHorizontal && !esVertical && !esDiagonal) return [inicio];
  const pasos = Math.max(Math.abs(df), Math.abs(dc));
  const stepF = df === 0 ? 0 : df / Math.abs(df);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  return Array.from({ length: pasos + 1 }, (_, i) => ({
    fila: inicio.fila + stepF * i,
    columna: inicio.columna + stepC * i,
  }));
}

const clave = (fila: number, columna: number) => `${fila}-${columna}`;

interface CuerpoProps {
  actividad: SopaLetrasActivity;
  ctx: ActivityShellContext;
  grid: string[][];
  colocadas: PalabraColocada[];
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult) => void;
}

function Cuerpo({ actividad, ctx, grid, colocadas, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, palabras } = actividad;
  const { filas, columnas } = configuracion;
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const cellSize = useSopaGridCellSize(gridAreaRef, filas, columnas);
  const jugando = ctx.sesion.fase === 'jugando';
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });

  const [encontradas, setEncontradas] = useState<PalabraColocada[]>([]);
  const [seleccion, setSeleccion] = useState<Celda[]>([]);
  const [celdaInicio, setCeldaInicio] = useState<Celda | null>(null);
  const [seleccionando, setSeleccionando] = useState(false);
  const [foco, setFoco] = useState<string>(clave(0, 0));
  const [anuncio, setAnuncio] = useState('');
  const celdaRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const terminada = useRef(false);

  useEffect(() => {
    setProgreso(encontradas.length);
  }, [encontradas.length, setProgreso]);

  // Tiempo agotado: sale lo hallado hasta ahora, una sola vez.
  useEffect(() => {
    if (!sinTiempo || terminada.current) return;
    terminada.current = true;
    const raw = { encontradas: encontradas.map((p) => p.texto) };
    alEvaluar(evaluateActivityResponse('sopa_letras', actividad, raw));
    responder(raw);
    setSeleccion([]);
    setCeldaInicio(null);
    setSeleccionando(false);
    setAnuncio('Se acabó el tiempo.');
    // Solo reacciona al fin por tiempo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinTiempo]);

  /** Cierra una selección: ¿es una palabra de la lista, nueva? */
  const cerrarSeleccion = useCallback(
    (celdas: Celda[]) => {
      if (!jugando || terminada.current) return;
      const palabra = seleccionEsPalabra(celdas, colocadas);
      if (palabra && !encontradas.find((e) => e.texto === palabra.texto)) {
        const nuevas = [...encontradas, palabra];
        setEncontradas(nuevas);
        if (nuevas.length === colocadas.length) {
          terminada.current = true;
          const raw = { encontradas: nuevas.map((p) => p.texto) };
          alEvaluar(evaluateActivityResponse('sopa_letras', actividad, raw));
          feedback.emitir('acierto', { movimiento: false });
          responder(raw);
          setAnuncio(`Encontraste ${palabra.texto}. ¡Hallaste todas las palabras!`);
          completar();
        } else {
          feedback.emitir('acierto', { movimiento: false });
          setAnuncio(`Encontraste ${palabra.texto}. ${nuevas.length} de ${colocadas.length} palabras.`);
        }
      } else if (palabra) {
        setAnuncio(`Ya encontraste ${palabra.texto}.`);
      } else if (celdas.length > 1) {
        feedback.emitir('error', { movimiento: false });
        setAnuncio('Esa selección no es una palabra de la lista.');
      }
    },
    [jugando, colocadas, encontradas, actividad, alEvaluar, feedback, responder, completar],
  );

  const terminarArrastre = useCallback(() => {
    if (!seleccionando) return;
    setSeleccionando(false);
    cerrarSeleccion(seleccion);
    setSeleccion([]);
    setCeldaInicio(null);
  }, [seleccionando, seleccion, cerrarSeleccion]);

  const iniciarArrastre = useCallback(
    (fila: number, columna: number) => {
      if (!jugando) return;
      setSeleccionando(true);
      setCeldaInicio({ fila, columna });
      setSeleccion([{ fila, columna }]);
    },
    [jugando],
  );

  const moverArrastre = useCallback(
    (fila: number, columna: number) => {
      if (!seleccionando || !celdaInicio) return;
      setSeleccion(celdasEnLinea(celdaInicio, { fila, columna }));
    },
    [seleccionando, celdaInicio],
  );

  const enfocar = (fila: number, columna: number) => {
    const k = clave(fila, columna);
    setFoco(k);
    celdaRefs.current[k]?.focus();
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLButtonElement>, fila: number, columna: number) => {
    if (!jugando) return;
    const paso = TECLA_A_PASO[e.key];
    if (paso) {
      e.preventDefault();
      const f = Math.min(Math.max(fila + paso.fila, 0), filas - 1);
      const c = Math.min(Math.max(columna + paso.columna, 0), columnas - 1);
      enfocar(f, c);
      // Con un inicio fijado, las flechas estiran la línea (solo en horizontal, vertical o diagonal).
      if (celdaInicio && !seleccionando) setSeleccion(celdasEnLinea(celdaInicio, { fila: f, columna: c }));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!celdaInicio) {
        setCeldaInicio({ fila, columna });
        setSeleccion([{ fila, columna }]);
        setAnuncio(
          `Inicio en fila ${fila + 1}, columna ${columna + 1}. Mueve con las flechas y pulsa Enter para confirmar.`,
        );
      } else {
        cerrarSeleccion(celdasEnLinea(celdaInicio, { fila, columna }));
        setSeleccion([]);
        setCeldaInicio(null);
      }
      return;
    }
    if (e.key === 'Escape' && celdaInicio) {
      e.preventDefault();
      setSeleccion([]);
      setCeldaInicio(null);
      setAnuncio('Selección cancelada.');
    }
  };

  /** Celda bajo el dedo (el arrastre táctil no dispara `mouseenter` en las celdas vecinas). */
  const celdaBajoDedo = (e: React.TouchEvent): Celda | null => {
    const t = e.touches[0] ?? e.changedTouches[0];
    if (!t) return null;
    const el = document.elementFromPoint(t.clientX, t.clientY)?.closest<HTMLElement>('[data-fila]');
    if (!el) return null;
    return { fila: Number(el.dataset.fila), columna: Number(el.dataset.columna) };
  };

  const indiceHallada = (fila: number, columna: number): number => {
    for (let i = 0; i < encontradas.length; i++) {
      if (encontradas[i]!.celdas.some((c) => c.fila === fila && c.columna === columna)) return i;
    }
    return -1;
  };
  const enSeleccion = (fila: number, columna: number) =>
    seleccion.some((c) => c.fila === fila && c.columna === columna);

  const fontSize = tamanoFuenteCeldaSopa(cellSize);

  return (
    <div className={styles.raiz}>
      {configuracion.mostrarLista && (
        <ul className={styles.lista} aria-label="Palabras para encontrar">
          {palabras.map((p, i) => {
            const hallada = encontradas.some((e) => e.texto === p.texto.toUpperCase().replace(/\s/g, ''));
            return (
              <li key={i} className={[styles.palabra, hallada ? styles.palabraHallada : ''].join(' ')}>
                {p.texto.toUpperCase()}
                {hallada && <span className={styles.soloLector}> (encontrada)</span>}
              </li>
            );
          })}
        </ul>
      )}

      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>

      <div ref={gridAreaRef} className={styles.area} onMouseLeave={terminarArrastre}>
        {cellSize > 0 && (
          <div
            className={styles.rejilla}
            role="group"
            aria-label="Sopa de letras"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: SOPA_LETRAS_GAP_PX,
            }}
            onTouchMove={(e) => {
              const c = celdaBajoDedo(e);
              if (c) moverArrastre(c.fila, c.columna);
            }}
            onTouchEnd={(e) => {
              // Evita los eventos de ratón sintetizados después del toque.
              if (e.cancelable) e.preventDefault();
              terminarArrastre();
            }}
          >
            {grid.map((fila, r) =>
              fila.map((letra, c) => {
                const k = clave(r, c);
                const idx = indiceHallada(r, c);
                const seleccionada = enSeleccion(r, c);
                const nombre =
                  `Fila ${r + 1}, columna ${c + 1}, letra ${letra}` +
                  (idx >= 0 ? `, de ${encontradas[idx]!.texto}` : '') +
                  (seleccionada ? ', seleccionada' : '');
                return (
                  <button
                    key={k}
                    ref={(el) => {
                      celdaRefs.current[k] = el;
                    }}
                    type="button"
                    data-fila={r}
                    data-columna={c}
                    aria-label={nombre}
                    tabIndex={k === foco ? 0 : -1}
                    onFocus={() => setFoco(k)}
                    onKeyDown={(e) => alTeclear(e, r, c)}
                    onMouseDown={() => iniciarArrastre(r, c)}
                    onMouseEnter={() => moverArrastre(r, c)}
                    onMouseUp={terminarArrastre}
                    onTouchStart={() => iniciarArrastre(r, c)}
                    className={[
                      styles.celda,
                      idx >= 0 ? styles[`hallada${idx % TINTES}` as 'hallada0'] : '',
                      seleccionada ? styles.celdaSeleccionada : '',
                    ].join(' ')}
                    style={{ width: cellSize, height: cellSize, fontSize }}
                  >
                    {letra}
                  </button>
                );
              }),
            )}
          </div>
        )}
      </div>

      <div className={styles.contador}>
        {encontradas.length} de {colocadas.length} palabras encontradas
      </div>
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function SopaLetrasViewer({ actividad, onResponse, onComplete }: SopaLetrasViewerProps) {
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  // La sopa se resuelve una sola vez (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes]);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // La rejilla se arma UNA vez por contenido (y semilla): cambiar un ajuste visual no la rehace.
  const { configuracion, palabras } = actividad;
  const huella = JSON.stringify([
    configuracion.filas,
    configuracion.columnas,
    configuracion.direcciones,
    palabras.map((p) => p.texto),
    ajustes.semilla,
  ]);
  const { grid, colocadas } = useMemo(
    () =>
      generarGrid(
        configuracion.filas,
        configuracion.columnas,
        palabras.map((p) => p.texto),
        configuracion.direcciones,
        ajustes.semilla,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [huella],
  );

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse ?? onComplete);
  useEffect(() => {
    salida.current = onResponse ?? onComplete;
  }, [onResponse, onComplete]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  return (
    <ActivityShell ajustes={ajustesShell} total={colocadas.length} evaluation={evaluation} className={styles.shell}>
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          ctx={ctx}
          grid={grid}
          colocadas={colocadas}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  );
}
