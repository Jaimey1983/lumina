/**
 * Campos del motor de interacción que viven en el CONTENIDO de un slide
 * (Etapa K, K6). El editor reconstruye `content` desde cero en cada guardado
 * con lo que conoce (bloques, fondo, guías, diseño, transición); un campo que
 * el editor aún no maneja se perdería en silencio en el siguiente autoguardado
 * (hallazgo de K6: pasaba con `reglas` y `capas`).
 *
 * Contrato: **omitir** uno de estos campos al guardar significa «no lo toco»;
 * para borrarlo se envía explícitamente vacío (`reglas: []`, `capas: []`).
 * K9a añade `bloqueoAvance` a esta lista.
 */
export const CAMPOS_DEL_MOTOR_DE_SLIDE = ['reglas', 'capas'] as const;

function esRegistro(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Devuelve `incoming` con los campos del motor que ya existían en `existing`
 * y que `incoming` no trae. Pura; no muta sus argumentos.
 */
export function conservarCamposDelMotor(
  incoming: unknown,
  existing: unknown,
): unknown {
  if (!esRegistro(incoming) || !esRegistro(existing)) return incoming;
  let resultado: Record<string, unknown> | null = null;
  for (const campo of CAMPOS_DEL_MOTOR_DE_SLIDE) {
    if (!(campo in incoming) && campo in existing) {
      resultado ??= { ...incoming };
      resultado[campo] = existing[campo];
    }
  }
  return resultado ?? incoming;
}
