'use client';

/**
 * Viewer de «Problema paso a paso» (U15) sobre el `ActivityShell`.
 *
 * Un enunciado y una secuencia de pasos, cada uno con su respuesta (número con tolerancia o expresión
 * algebraica) y pistas escalonadas. En modo `secuencial` cada paso se comprueba al momento (con
 * reintentos libres) y recién entonces aparece el siguiente; si no, se contesta todo y se comprueba al
 * final. Pedir pistas cuenta contra el presupuesto de pistas del shell (`ajustes.pistas`) y cada una
 * resta `costoPct` % del crédito de su paso EN LA NOTA (la calcula `@lumina/scoring`).
 *
 * Lo que sale por `onResponse` (DU2) es `[{ pasoId, respuesta, pistasUsadas }]` de TODOS los pasos
 * (los no contestados van con texto vacío). Si se acaba el tiempo, se envía lo contestado hasta ahí.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateActivityResponse, parseRespuestaNumerica, validarExpresionAlgebraica, type ActivityEvaluationResult } from '@lumina/scoring';
import type { ProblemaPaso, ProblemaPasosActivity } from '@lumina/types/slide';
import { MathText } from '@lumina/editor-shared/rich-text/math-text';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { AnuncioTocarColocar } from '../_shared/activity-tap-place.js';
import { describirToleranciaPaso, normalizarProblemaPasos, pistasDe, problemaPasosFingerprint } from './problema-pasos-config.js';
import styles from './problema-pasos.module.css';

export interface ProblemaPasosViewerProps {
  actividad: ProblemaPasosActivity;
  /** Canal de respuesta unificado (DU2). */
  onResponse?: (response: unknown) => void;
}

interface RespuestaPaso {
  pasoId: string;
  respuesta: string;
  pistasUsadas: number;
}

interface CuerpoProps {
  act: ProblemaPasosActivity;
  valores: Record<string, string>;
  setValores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pistasPaso: Record<string, number>;
  setPistasPaso: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  resueltos: string[];
  setResueltos: React.Dispatch<React.SetStateAction<string[]>>;
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
  alEvaluar: (e: ActivityEvaluationResult) => void;
}

function Cuerpo({ act, valores, setValores, pistasPaso, setPistasPaso, resueltos, setResueltos, ctx, responder, alEvaluar }: CuerpoProps) {
  const jugando = ctx.sesion.fase === 'jugando';
  const { setProgreso, completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [anuncio, setAnuncio] = useState('');
  const emitidoEn = useRef<number | null>(null);

  const construirRespuesta = useCallback(
    (soloResueltos: boolean): RespuestaPaso[] =>
      act.pasos.map((p) => ({
        pasoId: p.id,
        respuesta: soloResueltos && !resueltos.includes(p.id) ? '' : (valores[p.id] ?? '').trim(),
        pistasUsadas: pistasPaso[p.id] ?? 0,
      })),
    [act.pasos, resueltos, valores, pistasPaso],
  );

  useEffect(() => {
    setProgreso(
      act.secuencial ? resueltos.length : act.pasos.filter((p) => (valores[p.id] ?? '').trim().length > 0).length,
    );
  }, [act.secuencial, act.pasos, resueltos.length, valores, setProgreso]);

  const finalizar = useCallback(
    (respuesta: RespuestaPaso[]) => {
      const evaluada = evaluateActivityResponse('problema_pasos', act, respuesta);
      alEvaluar(evaluada);
      feedback.emitir(evaluada.correct ? 'acierto' : 'error', { movimiento: false });
      responder(respuesta);
      completar();
    },
    [act, alEvaluar, completar, feedback, responder],
  );

  // Se acabó el tiempo: se envía lo contestado hasta ese momento (una vez por corrida).
  useEffect(() => {
    if (ctx.sesion.motivoFin !== 'sin_tiempo' || emitidoEn.current === ctx.sesion.intento) return;
    emitidoEn.current = ctx.sesion.intento;
    const respuesta = construirRespuesta(act.secuencial);
    alEvaluar(evaluateActivityResponse('problema_pasos', act, respuesta));
    responder(respuesta);
  }, [ctx.sesion.motivoFin, ctx.sesion.intento, act, alEvaluar, construirRespuesta, responder]);

  const problemaDeExpresion = (paso: ProblemaPaso, texto: string): string | null =>
    paso.modo === 'algebraico' ? validarExpresionAlgebraica(texto) : null;

  const cambiar = (id: string, v: string) => {
    setValores((prev) => ({ ...prev, [id]: v }));
    setErrores((prev) => (prev[id] ? { ...prev, [id]: '' } : prev));
  };

  const pedirPista = (paso: ProblemaPaso) => {
    const usadas = pistasPaso[paso.id] ?? 0;
    const hay = pistasDe(paso);
    if (!jugando || usadas >= hay.length || ctx.pistasRestantes === 0) return;
    ctx.usarPista();
    setPistasPaso((prev) => ({ ...prev, [paso.id]: usadas + 1 }));
    setAnuncio(`Pista ${usadas + 1}: ${hay[usadas]}`);
  };

  const comprobarPaso = (paso: ProblemaPaso, indice: number) => {
    const texto = (valores[paso.id] ?? '').trim();
    if (!jugando || !texto) return;
    const problema = problemaDeExpresion(paso, texto);
    if (problema) {
      setErrores((prev) => ({ ...prev, [paso.id]: `Revisa tu expresión: ${problema}` }));
      return;
    }
    const ok = evaluateActivityResponse('problema_pasos', { pasos: [paso] }, [{ pasoId: paso.id, respuesta: texto, pistasUsadas: 0 }]).details[0]?.correct;
    if (!ok) {
      setErrores((prev) => ({ ...prev, [paso.id]: 'Todavía no es correcto. Revisa tu cálculo o pide una pista.' }));
      feedback.emitir('error', { movimiento: false });
      setAnuncio(`El paso ${indice + 1} todavía no es correcto.`);
      return;
    }
    setErrores((prev) => ({ ...prev, [paso.id]: '' }));
    setAnuncio(`Paso ${indice + 1} correcto.`);
    const nuevos = [...resueltos, paso.id];
    setResueltos(nuevos);
    if (nuevos.length === act.pasos.length) {
      const respuesta = act.pasos.map((p) => ({
        pasoId: p.id,
        respuesta: (p.id === paso.id ? texto : (valores[p.id] ?? '')).trim(),
        pistasUsadas: pistasPaso[p.id] ?? 0,
      }));
      finalizar(respuesta);
    } else {
      feedback.emitir('acierto', { movimiento: false });
    }
  };

  const comprobarTodo = () => {
    if (!jugando) return;
    const nuevos: Record<string, string> = {};
    for (const p of act.pasos) {
      const texto = (valores[p.id] ?? '').trim();
      const problema = texto ? problemaDeExpresion(p, texto) : null;
      if (problema) nuevos[p.id] = `Revisa tu expresión: ${problema}`;
    }
    if (Object.keys(nuevos).length > 0) {
      setErrores((prev) => ({ ...prev, ...nuevos }));
      return;
    }
    finalizar(construirRespuesta(false));
  };

  const primerPendiente = act.secuencial ? act.pasos.findIndex((p) => !resueltos.includes(p.id)) : -1;
  const visibles = act.secuencial ? act.pasos.slice(0, primerPendiente === -1 ? act.pasos.length : primerPendiente + 1) : act.pasos;
  const algunaRespuesta = act.pasos.some((p) => (valores[p.id] ?? '').trim().length > 0);
  const costo = ctx.ajustes.pistas.costoPct;
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';

  return (
    <div className={styles.tarjeta}>
      {act.enunciado && (
        <p className={styles.enunciado}>
          <MathText text={act.enunciado} />
        </p>
      )}
      {act.imagen && <img src={act.imagen} alt="" className={styles.imagen} />}

      <ol className={styles.pasos} aria-label="Pasos del problema">
        {visibles.map((paso, i) => {
          const resuelto = resueltos.includes(paso.id);
          const actual = jugando && !resuelto && (!act.secuencial || i === primerPendiente);
          const usadas = pistasPaso[paso.id] ?? 0;
          const hay = pistasDe(paso);
          const esperado = paso.modo === 'numerico' ? parseRespuestaNumerica(paso.respuesta) : null;
          const sinPistas = usadas >= hay.length || ctx.pistasRestantes === 0;
          const error = errores[paso.id];
          const idCampo = `pp-${paso.id}`;
          return (
            <li
              key={paso.id}
              data-paso={paso.id}
              data-resuelto={resuelto || undefined}
              className={[styles.paso, resuelto ? styles.pasoResuelto : actual && act.secuencial ? styles.pasoActual : ''].filter(Boolean).join(' ')}
            >
              <div className={styles.cabecera}>
                <span className={styles.numero}>{i + 1}.</span>
                <p className={styles.instruccion}>
                  <MathText text={paso.instruccion} />
                </p>
              </div>

              {resuelto ? (
                <p className={styles.resultado}>
                  <span aria-hidden>✓</span> Paso {i + 1} correcto: {(valores[paso.id] ?? '').trim()}
                  {paso.unidad ? ` ${paso.unidad}` : ''}
                </p>
              ) : (
                <>
                  <div className={styles.fila}>
                    <input
                      id={idCampo}
                      type="text"
                      inputMode={paso.modo === 'algebraico' ? 'text' : 'decimal'}
                      autoComplete="off"
                      aria-label={`Respuesta del paso ${i + 1}`}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${idCampo}-error` : undefined}
                      className={styles.campo}
                      placeholder={paso.modo === 'algebraico' ? 'Escribe una expresión' : 'Escribe un número'}
                      maxLength={paso.modo === 'algebraico' ? 200 : 40}
                      value={valores[paso.id] ?? ''}
                      disabled={!jugando}
                      onChange={(e) => cambiar(paso.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && act.secuencial) {
                          e.preventDefault();
                          comprobarPaso(paso, i);
                        }
                      }}
                    />
                    {paso.unidad ? <span className={styles.unidad}>{paso.unidad}</span> : null}
                  </div>
                  {paso.modo === 'numerico' && esperado !== null && actual && (
                    <p className={styles.ayuda}>{describirToleranciaPaso(paso, esperado)} Usa coma para los decimales.</p>
                  )}
                  {error ? (
                    <p id={`${idCampo}-error`} role="alert" className={styles.aviso}>
                      {error}
                    </p>
                  ) : null}
                </>
              )}

              {usadas > 0 && (
                <ol className={styles.pistas} aria-label={`Pistas del paso ${i + 1}`}>
                  {hay.slice(0, usadas).map((p, n) => (
                    <li key={n}>{p}</li>
                  ))}
                </ol>
              )}

              {actual && (
                <div className={styles.acciones}>
                  {act.secuencial && (
                    <button type="button" className={styles.boton} disabled={!(valores[paso.id] ?? '').trim()} onClick={() => comprobarPaso(paso, i)}>
                      Comprobar paso
                    </button>
                  )}
                  {hay.length > 0 && (
                    <button type="button" className={styles.botonSecundario} disabled={sinPistas} onClick={() => pedirPista(paso)}>
                      Pedir pista ({usadas} de {hay.length})
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {costo > 0 && <p className={styles.ayuda}>Cada pista resta {costo} % de ese paso en la nota.</p>}
      {ctx.pistasRestantes !== null && <p className={styles.ayuda}>Pistas disponibles: {ctx.pistasRestantes}.</p>}
      <AnuncioTocarColocar anuncio={anuncio} />

      {!act.secuencial && jugando && (
        <div className={styles.acciones}>
          <button type="button" className={styles.boton} disabled={!algunaRespuesta} onClick={comprobarTodo}>
            Comprobar
          </button>
        </div>
      )}
      {sinTiempo && (
        <p role="status" className={styles.estado}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function ProblemaPasosViewer({ actividad, onResponse }: ProblemaPasosViewerProps) {
  const act = useMemo(() => normalizarProblemaPasos(actividad), [actividad]);
  const huella = useMemo(() => problemaPasosFingerprint(act), [act]);
  const ajustes = useMemo(() => normalizarAjustes(act), [act]);

  const [valores, setValores] = useState<Record<string, string>>({});
  const [pistasPaso, setPistasPaso] = useState<Record<string, number>>({});
  const [resueltos, setResueltos] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);

  const reiniciar = useCallback(() => {
    setValores({});
    setPistasPaso({});
    setResueltos([]);
    setEvaluation(null);
  }, []);

  // Editar el contenido (o cambiar de slide) es una corrida nueva; cambiar solo un ajuste, no.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    reiniciar();
  }, [huella, reiniciar]);

  return (
    <ActivityShell
      key={huella}
      ajustes={ajustes}
      total={act.pasos.length}
      evaluation={evaluation}
      onReintentar={reiniciar}
      className={styles.shell}
    >
      {(ctx) => (
        <Cuerpo
          act={act}
          valores={valores}
          setValores={setValores}
          pistasPaso={pistasPaso}
          setPistasPaso={setPistasPaso}
          resueltos={resueltos}
          setResueltos={setResueltos}
          ctx={ctx}
          responder={responder}
          alEvaluar={setEvaluation}
        />
      )}
    </ActivityShell>
  );
}
