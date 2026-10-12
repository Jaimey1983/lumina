/**
 * U8 — qué ajustes comunes tienen EFECTO REAL en cada tipo de actividad.
 *
 * El panel (`ActividadAjustesPanel`) solo ofrece lo que está declarado acá: mostrar una opción
 * que el viewer no lee sería mentirle al docente. Un tipo entra a esta tabla cuando su
 * viewer migra al `ActivityShell` y lee `normalizarAjustes` (U4 y U9); mientras tanto,
 * `capacidadesDe` devuelve `null` y no hay panel común.
 *
 * `ajustes.modo` NO está acá a propósito: está declarado en `ActivitySettings` pero ni el
 * shell ni ningún viewer lo consume todavía.
 */
import type { Activity, ActivityRetroMomento } from '@lumina/types/slide';

export interface CapacidadesAjustes {
  /** Mostrar la nota 0–5 al terminar (`ajustes.mostrarNota`). */
  readonly mostrarNota?: boolean;
  /** Número de intentos (`ajustes.intentos`). */
  readonly intentos?: boolean;
  /** Límite de tiempo (`ajustes.tiempoLimiteSeg`). */
  readonly tiempo?: boolean;
  /** Vidas (`ajustes.vidas`). */
  readonly vidas?: boolean;
  /** Pistas (`ajustes.pistas`). */
  readonly pistas?: boolean;
  /** Barajar y «mismo orden para todos» (`ajustes.barajar` / `semilla`). */
  readonly barajar?: boolean;
  /** Momentos de retroalimentación que el viewer distingue; sin lista, no se ofrece. */
  readonly retroalimentacion?: readonly ActivityRetroMomento[];
  /** Mostrar la explicación/solución (`ajustes.mostrarSolucion`). */
  readonly mostrarSolucion?: boolean;
  /** Sonidos (`ajustes.sonido`). */
  readonly sonido?: boolean;
  /** Aspecto (`ajustes.estilo`). */
  readonly estilo?: boolean;
}

export const CAPACIDADES_AJUSTES: Readonly<Partial<Record<Activity['tipo'], CapacidadesAjustes>>> = {
  // Memoria: reintentos y tiempo del shell, mazo barajado, nota al final, sonido y estilo.
  memoria: { mostrarNota: true, intentos: true, tiempo: true, barajar: true, sonido: true, estilo: true },
  // Verdadero/Falso: una sola respuesta (sin nota ni reintentos), tiempo, mensaje y explicación.
  verdadero_falso: {
    tiempo: true,
    retroalimentacion: ['inmediata', 'ninguna'],
    mostrarSolucion: true,
    sonido: true,
    estilo: true,
  },
  // Respuesta corta (U9a.1): calificación manual; el viewer lee el tiempo límite, el sonido
  // de envío y el estilo. La pista (`hint`) se muestra siempre, no es un ajuste.
  short_answer: { tiempo: true, sonido: true, estilo: true },
  // Respuesta matemática (U9a.2): se califica sola pero de un solo envío; mismo viewer de
  // respuesta escrita. La pista (`hint`) y la unidad son datos del ejercicio, no ajustes.
  respuesta_matematica: { tiempo: true, sonido: true, estilo: true },
  // Completar blancos (U9a.3): un solo envío con el sonido de acierto/error; tiempo y estilo.
  // No hay mensaje ni explicación al responder (el viewer no los muestra), así que no se ofrecen.
  completar_blancos: { tiempo: true, sonido: true, estilo: true },
  // Encuesta viva (U9a.4): un solo voto; tiempo límite, sonido y estilo. NO se ofrece nota (es de
  // participación) ni «varias respuestas» (el viewer no lo implementa: ver la ficha).
  encuesta_viva: { tiempo: true, sonido: true, estilo: true },
  // Nube de palabras (U9a.5): participación; el tope de palabras y de caracteres son datos de la
  // actividad (su editor), no ajustes comunes. Tiempo límite, sonido y estilo.
  nube_palabras: { tiempo: true, sonido: true, estilo: true },
  // Balancear ecuación (U9a.6): un solo envío de coeficientes; tiempo, sonido y estilo.
  balancear_ecuacion: { tiempo: true, sonido: true, estilo: true },
  // Formular compuesto (U9a.7): un solo envío; tiempo, sonido y estilo.
  formular_compuesto: { tiempo: true, sonido: true, estilo: true },
  // Ubicar elemento (U9a.8): un solo envío; tiempo, sonido y estilo.
  ubicar_elemento: { tiempo: true, sonido: true, estilo: true },
};

/** Capacidades del tipo, o `null` si todavía no usa el panel común. */
export function capacidadesDe(tipo: Activity['tipo']): CapacidadesAjustes | null {
  return CAPACIDADES_AJUSTES[tipo] ?? null;
}

/** ¿Se ofrece alguna opción de la sección? Sirve para ocultar secciones enteras vacías. */
export const seccionesVisibles = (c: CapacidadesAjustes) => ({
  calificacion: c.mostrarNota === true,
  tiempoEIntentos: c.tiempo === true || c.intentos === true,
  vidas: c.vidas === true,
  pistas: c.pistas === true,
  orden: c.barajar === true,
  retroalimentacion: (c.retroalimentacion?.length ?? 0) > 0 || c.mostrarSolucion === true,
  sonidoYAspecto: c.sonido === true || c.estilo === true,
});
