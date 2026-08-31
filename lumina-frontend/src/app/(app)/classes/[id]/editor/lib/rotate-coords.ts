/**
 * Normaliza cualquier ángulo en grados al rango canónico [0, 360).
 */
export function normalizeAngle(deg: number): number {
  const norm = ((deg % 360) + 360) % 360;
  const rounded = Math.round(norm * 10) / 10;
  return rounded === 0 ? 0 : rounded;
}

/** Ángulos de snap cardinales y diagonales estándar (grados). */
export const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360] as const;

/** Umbral de atracción por defecto para imán en ángulos clave (en grados). */
export const DEFAULT_SNAP_ANGLE_THRESHOLD = 4;

/** Paso angular fijo al mantener pulsada la tecla Shift (en grados). */
export const SHIFT_STEP_ANGLE = 15;

/**
 * Aplica snap angular:
 * 1. Si `shiftKey` es true: redondea al múltiplo más cercano de `shiftStep` (default 15°).
 * 2. Si no: si está a menos de `threshold` grados de un ángulo cardinal/diagonal (0, 45, 90...), hace snap a ese ángulo exacto.
 * 3. En cualquier caso normaliza al rango [0, 360).
 */
export function snapAngle(
  angleDeg: number,
  options?: {
    shiftKey?: boolean;
    threshold?: number;
    shiftStep?: number;
  },
): number {
  const norm = normalizeAngle(angleDeg);

  if (options?.shiftKey) {
    const step = options.shiftStep ?? SHIFT_STEP_ANGLE;
    const stepped = Math.round(norm / step) * step;
    return normalizeAngle(stepped);
  }

  const threshold = options?.threshold ?? DEFAULT_SNAP_ANGLE_THRESHOLD;

  for (const snap of SNAP_ANGLES) {
    const target = snap === 360 ? 0 : snap;
    const diff = Math.min(
      Math.abs(norm - snap),
      Math.abs(norm - (snap === 0 ? 360 : snap)),
    );
    if (diff <= threshold) {
      return target;
    }
  }

  return norm;
}

/**
 * Calcula el ángulo de rotación (0–360°) dado el centro del elemento en coordenadas de pantalla (px)
 * y la posición actual del cursor (px).
 *
 * El punto 0° corresponde a las 12 en punto (hacia arriba).
 */
export function computeRotationAngle(
  centerX: number,
  centerY: number,
  mouseX: number,
  mouseY: number,
  options?: {
    shiftKey?: boolean;
    threshold?: number;
  },
): number {
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;

  // Math.atan2(dy, dx): 0 rad hacia la derecha (+X), PI/2 hacia abajo (+Y), -PI/2 hacia arriba (-Y)
  // Para que 0° sea hacia arriba (-Y): sumamos 90 grados al ángulo trigonométrico estándar.
  const rad = Math.atan2(dy, dx);
  const rawDeg = (rad * 180) / Math.PI + 90;

  return snapAngle(rawDeg, options);
}
