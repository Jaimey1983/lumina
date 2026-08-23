export const RULETA_MAX_ITEMS = 12
export const RULETA_MIN_ITEMS = 2
export const RULETA_VUELTAS_MIN = 6
export const RULETA_VUELTAS_MAX = 10
/** Ease-out que deja visibles varias vueltas (no comprime el giro en el primer segundo). */
export const RULETA_EASING = 'cubic-bezier(0.12, 0.65, 0.25, 1)'

export function generarIdRuleta(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Sectores en coordenadas SVG (Y hacia abajo).
 * El sector 0 empieza en las 12 en punto y avanza en sentido horario.
 */
export function calcularSectores(n: number): { inicio: number; fin: number; angulo: number }[] {
  const count = Math.max(n, 1)
  const paso = (2 * Math.PI) / count
  return Array.from({ length: count }, (_, i) => ({
    inicio: i * paso - Math.PI / 2,
    fin: (i + 1) * paso - Math.PI / 2,
    angulo: i * paso - Math.PI / 2 + paso / 2,
  }))
}

/**
 * El indicador está fijo arriba (12 en punto). CSS `rotate` gira la rueda
 * en sentido horario, así que el ángulo original bajo el indicador es
 * `(360 - rotación)`.
 */
export function calcularIndiceBajoIndicador(rotacionDeg: number, n: number): number {
  if (n <= 0) return 0
  const paso = 360 / n
  const rot = ((rotacionDeg % 360) + 360) % 360
  const anguloDesdeArriba = (360 - rot) % 360
  return Math.floor(anguloDesdeArriba / paso) % n
}

/**
 * Gira la rueda hacia delante (5–9 vueltas) hasta dejar el centro del
 * sector ganador exactamente bajo el indicador.
 */
export function calcularRotacionHastaGanador(
  indiceGanador: number,
  n: number,
  rotacionActual: number,
  vueltasMin = RULETA_VUELTAS_MIN,
  vueltasMax = RULETA_VUELTAS_MAX,
): number {
  if (n <= 0) return rotacionActual
  const paso = 360 / n
  const indice = ((indiceGanador % n) + n) % n
  const centroSector = indice * paso + paso / 2
  const destinoMod = (360 - centroSector) % 360
  const actualMod = ((rotacionActual % 360) + 360) % 360
  let delta = (destinoMod - actualMod + 360) % 360
  if (delta < 0.5) delta += 360
  const span = Math.max(vueltasMax - vueltasMin, 0)
  const vueltas = vueltasMin + Math.floor(Math.random() * (span + 1))
  return rotacionActual + vueltas * 360 + delta
}
