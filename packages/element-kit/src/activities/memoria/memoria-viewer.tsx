'use client';

/**
 * Viewer de Memoria sobre el `ActivityShell` (U4, piloto de la etapa U).
 *
 * El shell aporta fases, cronómetro, progreso y pantalla de resultados; el tablero es un
 * reducer puro (`memoria-board.ts`). Lo que sale hacia `@lumina/scoring` NO cambió: un
 * borrador (`wrapActivityDraftResponse`) cada vez que aparece un par nuevo y la respuesta
 * final `{ paresEncontrados }` al completar. Sale por `onResponse` (canal unificado, DU2);
 * `onComplete` se acepta solo como alias transitorio.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { MemoriaActivity } from '@lumina/types/slide';
import {
  evaluateActivityResponse,
  wrapActivityDraftResponse,
  type ActivityEvaluationResult,
} from '@lumina/scoring';

import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { calcularFilasMemoria } from './memoria-config.js';
import {
  RETARDO_PAR_ENCONTRADO_MS,
  crearTablero,
  paresEncontrados,
  tableroCompleto,
  tableroReducer,
  type TableroMemoria,
  type AccionTablero,
} from './memoria-board.js';
import {
  colorSimboloDorsoMemoria,
  RenderMemoriaContenido,
  RenderMemoriaDorso,
  simboloDorsoMemoria,
  memoriaCardSurfaceClass,
} from './memoria-shared.js';
import styles from './memoria.module.css';

export interface MemoriaViewerProps {
  actividad: MemoriaActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
  /** @deprecated Alias transitorio de `onResponse`; se retira al terminar U9d. */
  onComplete?: (response: unknown) => void;
}

interface TableroProps {
  actividad: MemoriaActivity;
  tablero: TableroMemoria;
  dispatch: (a: AccionTablero) => void;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult) => void;
}

function Tablero({ actividad, tablero, dispatch, ctx, responder, alEvaluar }: TableroProps) {
  const { configuracion } = actividad;
  const { cartas, resolviendo } = tablero;
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;

  const encontrados = useMemo(() => paresEncontrados(cartas), [cartas]);
  const claveEncontrados = encontrados.join('|');
  const completo = tableroCompleto(cartas);

  // Progreso para el encabezado del shell.
  useEffect(() => {
    setProgreso(cartas.filter((c) => c.encontrada).length / 2);
  }, [cartas, setProgreso]);

  // Resolver un par volteado tras la espera (cancelable: se limpia al desmontar o reiniciar).
  const espera = resolviendo
    ? resolviendo.coincide
      ? RETARDO_PAR_ENCONTRADO_MS
      : configuracion.tiempoVolteo
    : null;
  useEffect(() => {
    if (espera === null) return undefined;
    const id = setTimeout(() => dispatch({ tipo: 'resolver' }), espera);
    return () => clearTimeout(id);
  }, [espera, resolviendo, dispatch]);

  // Borrador: solo cuando cambian los pares encontrados (antes se repetía en cada volteo).
  const ultimaClave = useRef('');
  useEffect(() => {
    if (!jugando) return;
    if (claveEncontrados === '' || completo || claveEncontrados === ultimaClave.current) return;
    ultimaClave.current = claveEncontrados;
    responder(wrapActivityDraftResponse({ paresEncontrados: encontrados }));
  }, [jugando, claveEncontrados, completo, encontrados, responder]);

  // Respuesta final al completar el tablero.
  useEffect(() => {
    if (!jugando || !completo) return;
    const raw = { paresEncontrados: encontrados };
    alEvaluar(evaluateActivityResponse('memoria', actividad, raw));
    responder(raw);
    completar();
  }, [jugando, completo, encontrados, actividad, alEvaluar, responder, completar]);

  // Un tablero nuevo (reintento) vuelve a emitir sus borradores.
  useEffect(() => {
    if (encontrados.length === 0) ultimaClave.current = '';
  }, [encontrados.length]);

  const columnas = Math.max(1, configuracion.columnas);
  const filas = calcularFilasMemoria(cartas.length, columnas);
  const simbolo = simboloDorsoMemoria(configuracion);
  const colorSimbolo = colorSimboloDorsoMemoria(configuracion);

  return (
    <>
      <div className={styles.estadisticas}>
        <span>Intentos: {tablero.intentos}</span>
      </div>
      <div
        className={styles.tablero}
        style={{
          gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${filas}, minmax(0, 1fr))`,
        }}
      >
        {cartas.map((carta, i) => {
          const cara = carta.volteada || carta.encontrada;
          const contenido = carta.contenido.texto ?? carta.contenido.imagen ?? 'sin contenido';
          return (
            <button
              key={carta.id}
              type="button"
              onClick={() => dispatch({ tipo: 'voltear', id: carta.id })}
              disabled={!jugando || carta.encontrada || resolviendo !== null}
              aria-label={
                cara
                  ? `Carta ${i + 1}: ${contenido}${carta.encontrada ? ', encontrada' : ''}`
                  : `Carta ${i + 1}, boca abajo`
              }
              className={[
                memoriaCardSurfaceClass,
                styles.carta,
                cara ? styles.cartaVisible : styles.cartaOculta,
                carta.encontrada ? styles.cartaEncontrada : '',
              ].join(' ')}
              style={cara ? undefined : { backgroundColor: configuracion.colorDorso }}
            >
              {cara ? (
                <RenderMemoriaContenido contenido={carta.contenido} />
              ) : (
                <RenderMemoriaDorso simbolo={simbolo} color={colorSimbolo} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function MemoriaViewer({ actividad, onResponse, onComplete }: MemoriaViewerProps) {
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  const barajar = ajustes.barajar;
  const [tablero, dispatch] = useReducer(tableroReducer, undefined, () =>
    crearTablero(actividad.pares, barajar),
  );
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse ?? onComplete);
  useEffect(() => {
    salida.current = onResponse ?? onComplete;
  }, [onResponse, onComplete]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const alReintentar = useCallback(() => {
    setEvaluation(null);
    dispatch({ tipo: 'reiniciar', barajar });
  }, [barajar]);

  return (
    <ActivityShell
      ajustes={ajustes}
      total={actividad.pares.length}
      cronometro={actividad.configuracion.mostrarTimer}
      evaluation={evaluation}
      onReintentar={alReintentar}
    >
      {(ctx) => (
        <Tablero
          actividad={actividad}
          tablero={tablero}
          dispatch={dispatch}
          ctx={ctx}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  );
}
