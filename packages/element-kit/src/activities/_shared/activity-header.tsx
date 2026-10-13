'use client';

/**
 * U3 — encabezado común de una actividad: progreso, tiempo, vidas, puntaje e intento.
 * Solo muestra lo que `ajustes` y la sesión activan; sin límites, no pinta nada de ese tipo.
 */
import { formatearTiempo, type SesionActividad } from './use-actividad-sesion.js';
import styles from './activity-shell.module.css';

/** Por debajo de estos segundos el cronómetro se marca como urgente. */
export const TIEMPO_URGENTE_SEG = 10;

export interface ActivityHeaderProps {
  readonly sesion: SesionActividad;
  /** Muestra el puntaje de juego aunque sea 0. Por defecto, solo cuando ya hay puntos. */
  readonly mostrarPuntaje?: boolean;
}

export function ActivityHeader({ sesion, mostrarPuntaje = false }: ActivityHeaderProps) {
  const { config, progreso, vidas, tiempoRestante, transcurrido, puntaje, intento } = sesion;
  const cronometro = config.cronometro && tiempoRestante === null;
  const hayProgreso = progreso.total > 0;
  const urgente = tiempoRestante !== null && tiempoRestante <= TIEMPO_URGENTE_SEG;
  const vacio =
    !hayProgreso &&
    tiempoRestante === null &&
    !cronometro &&
    vidas === null &&
    !(mostrarPuntaje || puntaje > 0) &&
    !(config.intentosMax !== null && config.intentosMax > 1);
  if (vacio) return null;

  return (
    <header className={styles.encabezado} data-testid="actividad-encabezado">
      {hayProgreso && (
        <div className={styles.progreso}>
          <div
            className={styles.progresoPista}
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={0}
            aria-valuemax={progreso.total}
            aria-valuenow={progreso.actual}
            aria-valuetext={`${progreso.actual} de ${progreso.total}`}
          >
            <div
              className={styles.progresoRelleno}
              style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
            />
          </div>
          <span className={styles.etiqueta}>
            {progreso.actual}/{progreso.total}
          </span>
        </div>
      )}

      {config.intentosMax !== null && config.intentosMax > 1 && (
        <span className={styles.etiqueta}>
          Intento {intento} de {config.intentosMax}
        </span>
      )}

      {(mostrarPuntaje || puntaje > 0) && (
        <span className={styles.chip}>Puntos: {puntaje}</span>
      )}

      {tiempoRestante !== null && (
        <span
          className={`${styles.chip} ${urgente ? styles.chipUrgente : ''}`}
          role="timer"
          aria-label={`Tiempo restante: ${formatearTiempo(tiempoRestante)}`}
        >
          {formatearTiempo(tiempoRestante)}
        </span>
      )}

      {cronometro && (
        <span
          className={styles.chip}
          role="timer"
          aria-label={`Tiempo transcurrido: ${formatearTiempo(transcurrido)}`}
        >
          {formatearTiempo(transcurrido)}
        </span>
      )}

      {vidas !== null && config.vidasMax !== null && (
        <span
          className={styles.vidas}
          role="img"
          aria-label={`Vidas: ${vidas} de ${config.vidasMax}`}
        >
          {Array.from({ length: config.vidasMax }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={i < vidas ? styles.vidaLlena : styles.vidaVacia}
            >
              {i < vidas ? '♥' : '♡'}
            </span>
          ))}
        </span>
      )}
    </header>
  );
}
