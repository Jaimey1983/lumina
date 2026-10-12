'use client';

/**
 * Viewer de Crucigrama sobre el `ActivityShell` (U9c.3).
 *
 * El shell aporta fases, cronómetro, progreso y la pantalla de resultados. Lo que sale hacia
 * `@lumina/scoring` NO cambió: UNA respuesta `{ celdas }` al verificar, sin borradores; sale por
 * `onResponse` (canal unificado, DU2).
 *
 * Teclado completo (DU8): una sola celda entra al orden de tabulación (la actual) y las flechas
 * se mueven por la rejilla; Enter/Espacio alterna horizontal ↔ vertical en un cruce; Retroceso en
 * una celda vacía vuelve a la anterior de la palabra y la borra. Cada celda tiene nombre
 * («Fila 1, columna 2») y la pista de la palabra activa se anuncia por `aria-live`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CrucigramaActivity, CrucigramaPalabra } from '@lumina/types/slide';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { calcularBounds, construirMapaCeldas, numerarPalabras } from './crucigrama-config.js';
import {
  CRUCIGRAMA_GAP_PX,
  tamanoFuenteCeldaCrucigrama,
  tamanoNumeroCeldaCrucigrama,
  useCrucigramaCellSize,
} from './crucigrama-shared.js';
import styles from './crucigrama.module.css';

export interface CrucigramaViewerProps {
  actividad: CrucigramaActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

type Direccion = 'arriba' | 'abajo' | 'izquierda' | 'derecha';
const PASO: Record<Direccion, { df: number; dc: number }> = {
  arriba: { df: -1, dc: 0 },
  abajo: { df: 1, dc: 0 },
  izquierda: { df: 0, dc: -1 },
  derecha: { df: 0, dc: 1 },
};
const TECLA_A_DIRECCION: Record<string, Direccion> = {
  ArrowUp: 'arriba',
  ArrowDown: 'abajo',
  ArrowLeft: 'izquierda',
  ArrowRight: 'derecha',
};

interface CuerpoProps {
  actividad: CrucigramaActivity;
  ctx: ActivityShellContext;
  respuestas: Record<string, string>;
  setRespuestas: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult) => void;
}

function Cuerpo({ actividad, ctx, respuestas, setRespuestas, responder, alEvaluar }: CuerpoProps) {
  const { configuracion, palabras } = actividad;
  const { colorCelda, colorTexto } = configuracion;
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const bounds = useMemo(() => calcularBounds(palabras), [palabras]);
  const mapaCeldas = useMemo(() => construirMapaCeldas(palabras), [palabras]);
  const numeracion = useMemo(() => numerarPalabras(palabras), [palabras]);
  const filas = bounds.maxFila - bounds.minFila + 1;
  const columnas = bounds.maxCol - bounds.minCol + 1;
  const cellSize = useCrucigramaCellSize(gridAreaRef, filas, columnas);
  const jugando = ctx.sesion.fase === 'jugando';
  const verificado = !jugando && ctx.sesion.motivoFin !== 'sin_tiempo';
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });

  const [palabraActiva, setPalabraActiva] = useState<CrucigramaPalabra | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // La celda que entra al orden de tabulación (roving tabindex): por defecto, la primera.
  const primera = useMemo(() => {
    for (let r = bounds.minFila; r <= bounds.maxFila; r++)
      for (let c = bounds.minCol; c <= bounds.maxCol; c++) if (mapaCeldas.has(`${r}-${c}`)) return `${r}-${c}`;
    return '';
  }, [bounds, mapaCeldas]);
  const [foco, setFoco] = useState(primera);

  // Tiempo agotado: sale lo escrito hasta ahora, una sola vez (la rejilla queda bloqueada).
  const emitidaPorTiempo = useRef(false);
  useEffect(() => {
    if (!sinTiempo || emitidaPorTiempo.current) return;
    emitidaPorTiempo.current = true;
    const raw = { celdas: { ...respuestas } };
    alEvaluar(evaluateActivityResponse('crucigrama', actividad, raw));
    responder(raw);
    // Solo reacciona al fin por tiempo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinTiempo]);

  const estadoCeldas = useMemo(() => {
    if (!verificado) return {};
    const estado: Record<string, 'correcto' | 'incorrecto'> = {};
    mapaCeldas.forEach(({ letra }, key) => {
      estado[key] = (respuestas[key] ?? '').toUpperCase() === letra ? 'correcto' : 'incorrecto';
    });
    return estado;
  }, [verificado, respuestas, mapaCeldas]);

  // El encabezado del shell cuenta las palabras ya completas (todas sus letras escritas).
  const completas = useMemo(
    () =>
      palabras.filter((p) =>
        [...p.texto].every((_, i) => {
          const f = p.direccion === 'vertical' ? p.fila + i : p.fila;
          const c = p.direccion === 'horizontal' ? p.columna + i : p.columna;
          return (respuestas[`${f}-${c}`] ?? '') !== '';
        }),
      ).length,
    [palabras, respuestas],
  );
  useEffect(() => {
    setProgreso(completas);
  }, [completas, setProgreso]);

  const palabrasEn = useCallback(
    (fila: number, columna: number) => ({
      h: palabras.find(
        (p) => p.direccion === 'horizontal' && p.fila === fila && columna >= p.columna && columna < p.columna + p.texto.length,
      ),
      v: palabras.find(
        (p) => p.direccion === 'vertical' && p.columna === columna && fila >= p.fila && fila < p.fila + p.texto.length,
      ),
    }),
    [palabras],
  );

  const alTocarCelda = useCallback(
    (fila: number, columna: number) => {
      if (!jugando) return;
      const key = `${fila}-${columna}`;
      if (!mapaCeldas.has(key)) return;
      setFoco(key);
      const { h, v } = palabrasEn(fila, columna);
      if (h && palabraActiva?.id === h.id && v) setPalabraActiva(v);
      else setPalabraActiva(h ?? v ?? null);
      inputRefs.current[key]?.focus();
    },
    [jugando, mapaCeldas, palabrasEn, palabraActiva],
  );

  const enfocar = useCallback((key: string) => {
    setFoco(key);
    inputRefs.current[key]?.focus();
  }, []);

  const alEscribir = useCallback(
    (fila: number, columna: number, valor: string) => {
      if (!jugando) return;
      const letra = valor.slice(-1).toUpperCase();
      const key = `${fila}-${columna}`;
      setRespuestas((prev) => ({ ...prev, [key]: letra }));
      if (letra && palabraActiva) {
        const { df, dc } = palabraActiva.direccion === 'horizontal' ? { df: 0, dc: 1 } : { df: 1, dc: 0 };
        const siguiente = `${fila + df}-${columna + dc}`;
        if (mapaCeldas.has(siguiente)) enfocar(siguiente);
      }
    },
    [jugando, palabraActiva, mapaCeldas, setRespuestas, enfocar],
  );

  /** Primera celda existente en esa dirección desde (fila, columna), o `null`. */
  const vecina = useCallback(
    (fila: number, columna: number, dir: Direccion): string | null => {
      const { df, dc } = PASO[dir];
      let f = fila + df;
      let c = columna + dc;
      while (f >= bounds.minFila && f <= bounds.maxFila && c >= bounds.minCol && c <= bounds.maxCol) {
        if (mapaCeldas.has(`${f}-${c}`)) return `${f}-${c}`;
        f += df;
        c += dc;
      }
      return null;
    },
    [bounds, mapaCeldas],
  );

  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>, fila: number, columna: number) => {
    if (!jugando) return;
    const dir = TECLA_A_DIRECCION[e.key];
    if (dir) {
      e.preventDefault();
      const destino = vecina(fila, columna, dir);
      if (destino) {
        enfocar(destino);
        // Moverse en horizontal activa la palabra horizontal de la celda; en vertical, la vertical.
        const [f, c] = destino.split('-').map(Number);
        const { h, v } = palabrasEn(f!, c!);
        const nueva = dir === 'izquierda' || dir === 'derecha' ? (h ?? v) : (v ?? h);
        if (nueva) setPalabraActiva(nueva);
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      // En un cruce alterna horizontal ↔ vertical; nunca escribe un espacio.
      e.preventDefault();
      alTocarCelda(fila, columna);
      return;
    }
    if (e.key === 'Backspace' && (respuestas[`${fila}-${columna}`] ?? '') === '' && palabraActiva) {
      const { df, dc } = palabraActiva.direccion === 'horizontal' ? { df: 0, dc: 1 } : { df: 1, dc: 0 };
      const anterior = `${fila - df}-${columna - dc}`;
      if (mapaCeldas.has(anterior)) {
        e.preventDefault();
        setRespuestas((prev) => ({ ...prev, [anterior]: '' }));
        enfocar(anterior);
      }
    }
  };

  const verificar = () => {
    if (!jugando) return;
    const raw = { celdas: { ...respuestas } };
    const evaluada = evaluateActivityResponse('crucigrama', actividad, raw);
    alEvaluar(evaluada);
    feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
    responder(raw);
    completar();
  };

  const enActiva = (fila: number, columna: number): boolean => {
    if (!palabraActiva) return false;
    const { df, dc } = palabraActiva.direccion === 'horizontal' ? { df: 0, dc: 1 } : { df: 1, dc: 0 };
    for (let i = 0; i < palabraActiva.texto.length; i++) {
      if (palabraActiva.fila + df * i === fila && palabraActiva.columna + dc * i === columna) return true;
    }
    return false;
  };

  const fontSize = tamanoFuenteCeldaCrucigrama(cellSize);
  const numeroSize = tamanoNumeroCeldaCrucigrama(cellSize);
  const idPista = 'crucigrama-pista-activa';
  const textoPista = palabraActiva
    ? `${numeracion.get(palabraActiva.id)}${palabraActiva.direccion === 'horizontal' ? 'H' : 'V'}. ${palabraActiva.pista}`
    : '';

  return (
    <div className={styles.raiz}>
      <div className={styles.pistaActiva}>
        {palabraActiva ? (
          <div className={styles.pistaCaja} id={idPista}>
            <span className={styles.pistaNumero}>
              {numeracion.get(palabraActiva.id)}
              {palabraActiva.direccion === 'horizontal' ? 'H' : 'V'}.
            </span>
            {palabraActiva.pista}
          </div>
        ) : (
          <span className={styles.pistaVacia}>Haz clic en una celda para ver la pista</span>
        )}
      </div>
      {/* El lector de pantalla oye la pista de la palabra activa al cambiar. */}
      <div role="status" aria-live="polite" className={styles.soloLector}>
        {textoPista ? `${textoPista} (${palabraActiva!.texto.length} letras)` : ''}
      </div>

      <div ref={gridAreaRef} className={styles.areaRejilla}>
        {cellSize > 0 && (
          <div
            className={styles.rejilla}
            role="group"
            aria-label="Crucigrama"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: CRUCIGRAMA_GAP_PX,
            }}
          >
            {Array.from({ length: filas }, (_, r) =>
              Array.from({ length: columnas }, (_, c) => {
                const fila = r + bounds.minFila;
                const col = c + bounds.minCol;
                const key = `${fila}-${col}`;
                const celda = mapaCeldas.get(key);
                const estado = estadoCeldas[key];
                const numPista = palabras.find((p) => p.fila === fila && p.columna === col);
                const numero = numPista ? numeracion.get(numPista.id) : undefined;

                if (!celda) {
                  return <div key={key} style={{ width: cellSize, height: cellSize }} aria-hidden />;
                }

                const clase = [
                  styles.celda,
                  estado === 'correcto' ? styles.celdaCorrecta : '',
                  estado === 'incorrecto' || (!estado && celda.conflicto) ? styles.celdaIncorrecta : '',
                  !estado && !celda.conflicto && enActiva(fila, col) ? styles.celdaActiva : '',
                ].join(' ');
                const nombre =
                  `Fila ${fila - bounds.minFila + 1}, columna ${col - bounds.minCol + 1}` +
                  (numero ? `, inicio de la palabra ${numero}` : '') +
                  (estado ? (estado === 'correcto' ? ', correcta' : ', incorrecta') : '');

                return (
                  <div
                    key={key}
                    onClick={() => alTocarCelda(fila, col)}
                    style={{ width: cellSize, height: cellSize, ...(!estado && !celda.conflicto && !enActiva(fila, col) ? { backgroundColor: colorCelda } : {}) }}
                    className={clase}
                  >
                    {numero && (
                      <span className={styles.numero} style={{ fontSize: numeroSize }} aria-hidden>
                        {numero}
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        inputRefs.current[key] = el;
                      }}
                      type="text"
                      maxLength={2}
                      autoComplete="off"
                      aria-label={nombre}
                      aria-describedby={palabraActiva && enActiva(fila, col) ? idPista : undefined}
                      tabIndex={key === foco ? 0 : -1}
                      value={respuestas[key] ?? ''}
                      onFocus={() => setFoco(key)}
                      onChange={(e) => alEscribir(fila, col, e.target.value)}
                      onClick={() => alTocarCelda(fila, col)}
                      onKeyDown={(e) => alTeclear(e, fila, col)}
                      readOnly={!jugando}
                      className={styles.entrada}
                      style={{ fontSize, color: colorTexto }}
                    />
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>

      <div className={styles.listas}>
        <div className={styles.lista}>
          <p className={styles.tituloLista}>Horizontales</p>
          {palabras
            .filter((p) => p.direccion === 'horizontal')
            .map((p) => (
              <div key={p.id} className={styles.itemLista}>
                <span className={styles.itemNumero}>{numeracion.get(p.id)}.</span> {p.pista}
              </div>
            ))}
        </div>
        <div className={styles.lista}>
          <p className={styles.tituloLista}>Verticales</p>
          {palabras
            .filter((p) => p.direccion === 'vertical')
            .map((p) => (
              <div key={p.id} className={styles.itemLista}>
                <span className={styles.itemNumero}>{numeracion.get(p.id)}.</span> {p.pista}
              </div>
            ))}
        </div>
      </div>

      {!verificado && (
        <button type="button" className={styles.verificar} onClick={verificar} disabled={!jugando}>
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

export function CrucigramaViewer({ actividad, onResponse }: CrucigramaViewerProps) {
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  // El crucigrama admite una sola verificación (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes]);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  // El canal de salida siempre apunta al callback vigente, sin re-disparar efectos.
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  return (
    <ActivityShell
      ajustes={ajustesShell}
      total={actividad.palabras.length}
      evaluation={evaluation}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          ctx={ctx}
          respuestas={respuestas}
          setRespuestas={setRespuestas}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  );
}
