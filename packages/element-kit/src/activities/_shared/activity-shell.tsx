'use client';

/**
 * U3 — `ActivityShell`: el marco común de toda actividad (etapa U / DU1).
 *
 * Envuelve la mecánica de una actividad y se ocupa de lo que todas repetían: pantalla de
 * presentación, encabezado (progreso, tiempo, vidas, puntaje, intento), fases, fin por
 * vidas o tiempo, revisión y pantalla de resultados. La actividad recibe un contexto con
 * la sesión y acciones (`completar`, `perderVida`, …) y solo implementa su juego.
 *
 *   <ActivityShell ajustes={normalizarAjustes(actividad)} total={preguntas.length}
 *                  evaluation={evaluacion} onReintentar={reiniciarMiEstado}>
 *     {({ sesion, completar }) => <MiMecanica fase={sesion.fase} onTerminar={completar} />}
 *   </ActivityShell>
 *
 * El shell NO califica ni conoce la forma de la respuesta (DU7): la actividad evalúa con
 * `@lumina/scoring` y le pasa el resultado en `evaluation` para mostrarlo.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import type { ActivityEvaluationResult } from '@lumina/scoring';

import { ActivityHeader } from './activity-header.js';
import { ActivityResultScreen, anuncioDeResultado } from './activity-result-screen.js';
import type { AjustesResueltos } from './activity-settings.js';
import {
  pistasRestantes,
  puedeReintentar,
  useActividadSesion,
  type AccionesSesion,
  type MotivoFin,
  type OpcionesSesion,
  type SesionActividad,
} from './use-actividad-sesion.js';
import tokens from './activity-tokens.module.css';
import styles from './activity-shell.module.css';

/** Lo que el shell le entrega a la mecánica de la actividad. */
export interface ActivityShellContext extends Omit<AccionesSesion, 'iniciar' | 'verResultado' | 'reintentar'> {
  readonly sesion: SesionActividad;
  readonly ajustes: AjustesResueltos;
  /** Pistas que quedan; `null` = ilimitadas. */
  readonly pistasRestantes: number | null;
}

export interface ActivityShellProps extends OpcionesSesion {
  /** Salida de `normalizarAjustes(actividad)`. */
  readonly ajustes: AjustesResueltos;
  readonly titulo?: string;
  /** Texto de la pantalla de presentación (con `conIntro`). */
  readonly instruccion?: string;
  /** Resultado de `evaluateActivityResponse`, cuando la actividad ya terminó. */
  readonly evaluation?: ActivityEvaluationResult | null;
  /** Muestra el puntaje de juego en el encabezado aunque sea 0. */
  readonly mostrarPuntaje?: boolean;
  /**
   * Qué pasa al llegar a `resultado`: `'dialogo'` (por defecto) abre `ActivityResultScreen`;
   * `'ninguno'` deja la actividad mostrando su propio feedback en el lugar (p. ej.
   * Verdadero/Falso). En ambos casos `sesion.fase` pasa a `resultado` y se anuncia a
   * los lectores de pantalla.
   */
  readonly resultado?: 'dialogo' | 'ninguno';
  /**
   * Se llama DESPUÉS de que el shell reinicia su sesión por «Reintentar»: la actividad
   * debe reiniciar su propio estado (cartas, respuestas…).
   */
  readonly onReintentar?: () => void;
  /** Se llama una vez por corrida, al terminar, con el motivo. */
  readonly onFin?: (motivo: MotivoFin) => void;
  readonly className?: string;
  readonly children: (contexto: ActivityShellContext) => ReactNode;
}

export function ActivityShell({
  ajustes,
  titulo,
  instruccion,
  evaluation,
  mostrarPuntaje,
  onReintentar,
  onFin,
  resultado = 'dialogo',
  className,
  children,
  conIntro,
  conRevision,
  cronometro,
  total,
}: ActivityShellProps) {
  const sesionHook = useActividadSesion(ajustes, { conIntro, conRevision, cronometro, total });
  const { sesion, iniciar, verResultado, reintentar } = sesionHook;
  const { fase, motivoFin, intento } = sesion;

  // `onFin` una vez por corrida (cambia `intento` al reintentar).
  const onFinRef = useRef(onFin);
  useEffect(() => {
    onFinRef.current = onFin;
  }, [onFin]);
  useEffect(() => {
    if (motivoFin) onFinRef.current?.(motivoFin);
  }, [motivoFin, intento]);

  const contexto: ActivityShellContext = {
    sesion,
    ajustes,
    pistasRestantes: pistasRestantes(sesion),
    completar: sesionHook.completar,
    perderVida: sesionHook.perderVida,
    sumarPuntaje: sesionHook.sumarPuntaje,
    setProgreso: sesionHook.setProgreso,
    usarPista: sesionHook.usarPista,
  };

  function alReintentar() {
    reintentar();
    onReintentar?.();
  }

  const terminada = fase === 'resultado';
  const modal = terminada && resultado === 'dialogo';

  return (
    <div
      className={`${tokens.tokens} ${styles.raiz} ${className ?? ''}`}
      data-fase={fase}
      data-estilo={ajustes.estilo}
    >
      {fase === 'intro' ? (
        <div className={styles.intro} data-testid="actividad-intro">
          {titulo && <h2 className={styles.titulo}>{titulo}</h2>}
          {instruccion && <p className={styles.instruccion}>{instruccion}</p>}
          <button type="button" className={styles.boton} onClick={iniciar}>
            Comenzar
          </button>
        </div>
      ) : (
        <>
          <ActivityHeader sesion={sesion} mostrarPuntaje={mostrarPuntaje} />
          {/* `inert`: con el diálogo abierto, el fondo no recibe foco ni clics. */}
          <div className={styles.contenido} inert={modal}>
            {children(contexto)}
          </div>
          {fase === 'revision' && (
            <div className={styles.barraRevision}>
              <span>Revisa tus respuestas.</span>
              <button type="button" className={styles.boton} onClick={verResultado}>
                Ver resultado
              </button>
            </div>
          )}
          {modal && (
            <ActivityResultScreen
              evaluation={evaluation}
              motivoFin={motivoFin}
              mostrarNota={ajustes.mostrarNota}
              mostrarSolucion={ajustes.mostrarSolucion}
              intento={intento}
              intentosMax={sesion.config.intentosMax}
              onReintentar={puedeReintentar(sesion) ? alReintentar : undefined}
            />
          )}
        </>
      )}

      {/* Anuncio para lectores de pantalla al terminar (el diálogo ya anuncia su título). */}
      <div role="status" aria-live="polite" className={styles.soloLector}>
        {terminada ? anuncioDeResultado(evaluation, motivoFin ?? 'completada', ajustes.mostrarNota) : ''}
      </div>
    </div>
  );
}
