'use client';

/**
 * U3 — pantalla de resultados de una actividad (etapa U / DU6). Reemplazó al viejo
 * `ActivityResultOverlay`, que se borró en U9d.
 *
 * Es un `role="dialog"` modal: al abrirse mueve el foco al diálogo, lo mantiene dentro
 * (Tab cicla, Escape cierra si hay `onCerrar`) y al desmontarse lo devuelve a donde
 * estaba. Muestra nota o resumen según `mostrarNota`, desglose por ítem, intento y
 * «Reintentar» solo si quedan intentos. No calcula la nota: la toma de
 * `evaluation.score` (`@lumina/scoring`, DU7) y solo la deriva con `notaColombiana` si la
 * evaluación no la trae.
 */
import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { notaColombiana, type ActivityEvaluationResult } from '@lumina/scoring';

import type { MotivoFin } from './use-actividad-sesion.js';
import tokens from './activity-tokens.module.css';
import styles from './activity-shell.module.css';

/** Nota mínima (escala colombiana 0–5) para considerar «aprobado». */
export const NOTA_APROBATORIA = 3;

export interface ActivityResultScreenProps {
  /** Evaluación de `evaluateActivityResponse`. Sin ella solo se muestra el motivo de fin. */
  readonly evaluation?: ActivityEvaluationResult | null;
  /** Por qué terminó la corrida. Por defecto `completada`. */
  readonly motivoFin?: MotivoFin | null;
  /** `ajustes.mostrarNota`. */
  readonly mostrarNota: boolean;
  /** `ajustes.mostrarSolucion`: agrega la etiqueta de cada ítem al desglose. */
  readonly mostrarSolucion?: boolean;
  readonly intento: number;
  /** `null` = intentos ilimitados. */
  readonly intentosMax: number | null;
  /** Si es `undefined`, no se ofrece «Reintentar» (sin intentos, o la actividad no lo permite). */
  readonly onReintentar?: () => void;
  /** Si existe, se ofrece «Cerrar» y Escape. */
  readonly onCerrar?: () => void;
}

interface Resumen {
  readonly correctas: number;
  readonly total: number;
  readonly nota: number | null;
}

function resumir(evaluation: ActivityEvaluationResult | null | undefined): Resumen {
  const details = evaluation?.details ?? [];
  const correctas = details.filter((d) => d.correct).length;
  const total = details.length;
  const score = evaluation?.score;
  const nota =
    score !== null && score !== undefined && Number.isFinite(score)
      ? score
      : total > 0
        ? notaColombiana(correctas, total, true)
        : null;
  return { correctas, total, nota };
}

function titular(motivo: MotivoFin, nota: number | null, mostrarNota: boolean): string {
  if (motivo === 'sin_vidas') return 'Te quedaste sin vidas';
  if (motivo === 'sin_tiempo') return 'Se acabó el tiempo';
  if (!mostrarNota || nota === null) return '¡Completado!';
  return nota >= NOTA_APROBATORIA ? '¡Muy bien!' : 'Sigue practicando';
}

/** Texto que lee un lector de pantalla al abrirse el resultado (también lo usa el shell). */
export function anuncioDeResultado(
  evaluation: ActivityEvaluationResult | null | undefined,
  motivo: MotivoFin,
  mostrarNota: boolean,
): string {
  const { correctas, total, nota } = resumir(evaluation);
  const partes = [titular(motivo, nota, mostrarNota)];
  if (mostrarNota && nota !== null) partes.push(`Nota ${nota.toFixed(1)}`);
  if (total > 0) partes.push(`${correctas} de ${total} correctas`);
  return partes.join('. ');
}

const FOCALIZABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ActivityResultScreen({
  evaluation,
  motivoFin,
  mostrarNota,
  mostrarSolucion = false,
  intento,
  intentosMax,
  onReintentar,
  onCerrar,
}: ActivityResultScreenProps) {
  const idTitulo = useId();
  const dialogo = useRef<HTMLDivElement>(null);
  const motivo: MotivoFin = motivoFin ?? 'completada';
  const { correctas, total, nota } = resumir(evaluation);
  const aprobado = nota !== null && nota >= NOTA_APROBATORIA;
  const details = evaluation?.details ?? [];

  // Foco: entra al abrir, vuelve a donde estaba al cerrar.
  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogo.current?.focus();
    return () => {
      if (previo && previo.isConnected) previo.focus();
    };
  }, []);

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' && onCerrar) {
      e.stopPropagation();
      onCerrar();
      return;
    }
    if (e.key !== 'Tab' || !dialogo.current) return;
    const dentro = Array.from(dialogo.current.querySelectorAll<HTMLElement>(FOCALIZABLES));
    if (dentro.length === 0) {
      e.preventDefault();
      return;
    }
    const primero = dentro[0];
    const ultimo = dentro[dentro.length - 1];
    const activo = document.activeElement;
    if (e.shiftKey && (activo === primero || activo === dialogo.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && activo === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  return (
    <div className={`${tokens.tokens} ${styles.velo}`}>
      <div
        ref={dialogo}
        className={styles.dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onKeyDown={alTeclear}
        data-testid="actividad-resultado"
      >
        <h2 id={idTitulo} className={styles.resultadoTitulo}>
          {titular(motivo, nota, mostrarNota)}
        </h2>

        {mostrarNota && nota !== null && (
          <p
            className={`${styles.nota} ${aprobado ? styles.notaAprobada : styles.notaReprobada}`}
            aria-label={`Nota ${nota.toFixed(1)} de 5`}
          >
            {nota.toFixed(1)}
          </p>
        )}

        {total > 0 && (
          <p className={styles.resumen}>
            {correctas} de {total} correctas ({Math.round((correctas / total) * 100)}%)
          </p>
        )}

        {details.length > 1 && (
          <ol className={styles.desglose} aria-label="Resultado por ítem">
            {details.map((d) => (
              <li
                key={d.index}
                className={`${styles.item} ${d.correct ? styles.itemCorrecto : styles.itemIncorrecto}`}
              >
                <span aria-hidden="true">{d.correct ? '✓' : '✗'}</span>
                <span>
                  {mostrarSolucion && d.label ? d.label : `Ítem ${d.index + 1}`}
                  {': '}
                  {d.correct ? 'correcto' : 'incorrecto'}
                </span>
              </li>
            ))}
          </ol>
        )}

        {intentosMax !== null && intentosMax > 1 && (
          <p className={styles.resumen}>
            Intento {intento} de {intentosMax}
          </p>
        )}

        {(onReintentar || onCerrar) && (
          <div className={styles.acciones}>
            {onReintentar && (
              <button type="button" className={styles.boton} onClick={onReintentar}>
                Reintentar
              </button>
            )}
            {onCerrar && (
              <button type="button" className={styles.botonSecundario} onClick={onCerrar}>
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
