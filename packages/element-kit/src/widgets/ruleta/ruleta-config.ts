import type { RuletaWidget } from '@lumina/types/widget';

export const RULETA_MAX_ITEMS = 12;
export const RULETA_MIN_ITEMS = 2;
export const RULETA_VUELTAS_MIN = 6;
export const RULETA_VUELTAS_MAX = 10;
/** Ease-out que deja visibles varias vueltas (no comprime el giro en el primer segundo). */
export const RULETA_EASING = 'cubic-bezier(0.12, 0.65, 0.25, 1)';

export const RULETA_COLORES_DEFAULT = [
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
];

export function generarIdRuleta(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Opciones de T7 que aún no están en `RuletaWidget` de `@lumina/types` (fuera del
 * alcance de esa ficha): peso por ítem, «eliminar ganador», historial y confeti.
 * Se leen del JSON guardado con estos tipos; subirlas a `@lumina/types` queda como seguimiento.
 */
export interface RuletaItemT7 {
  id: string;
  texto: string;
  /** Peso relativo (tamaño del sector Y probabilidad de salir). Sin valor = 1. */
  peso?: number;
}

export interface RuletaConfigT7 {
  /** Tras cada tirada el ganador sale de la rueda (sin repetición). */
  modoEliminar?: boolean;
  /** Lista las últimas tiradas bajo el botón. */
  mostrarHistorial?: boolean;
  /** Lluvia de confeti al parar (se omite con «reducir movimiento»). */
  confeti?: boolean;
}

export type RuletaConfiguracion = RuletaWidget['configuracion'] & RuletaConfigT7;

export const RULETA_PESO_DEFAULT = 1;
export const RULETA_PESO_MAX = 20;

/** Peso válido de un ítem: número finito > 0 (1 si falta o es inválido), con tope. */
export function pesoDe(item: object | undefined): number {
  const n = Number((item as { peso?: unknown } | undefined)?.peso);
  if (!Number.isFinite(n) || n <= 0) return RULETA_PESO_DEFAULT;
  return Math.min(RULETA_PESO_MAX, n);
}

function normalizarPesos(n: number, pesos?: readonly number[]): number[] {
  const count = Math.max(n, 1);
  if (!pesos || pesos.length !== count) return Array.from({ length: count }, () => 1);
  return pesos.map((p) => (Number.isFinite(p) && p > 0 ? p : 1));
}

/**
 * Sectores en coordenadas SVG (Y hacia abajo).
 * El sector 0 empieza en las 12 en punto y avanza en sentido horario. Con `pesos`
 * (uno por sector) cada sector mide en proporción a su peso; sin ellos, todos iguales.
 */
export function calcularSectores(
  n: number,
  pesos?: readonly number[],
): { inicio: number; fin: number; angulo: number }[] {
  const ps = normalizarPesos(n, pesos);
  const total = ps.reduce((a, b) => a + b, 0);
  let acumulado = 0;
  return ps.map((p) => {
    const inicio = (acumulado / total) * 2 * Math.PI - Math.PI / 2;
    acumulado += p;
    const fin = (acumulado / total) * 2 * Math.PI - Math.PI / 2;
    return { inicio, fin, angulo: (inicio + fin) / 2 };
  });
}

/** Límites de cada sector en grados desde las 12 en punto (0–360). */
function limitesGrados(n: number, pesos?: readonly number[]): { desde: number; hasta: number }[] {
  const ps = normalizarPesos(n, pesos);
  const total = ps.reduce((a, b) => a + b, 0);
  let acumulado = 0;
  return ps.map((p) => {
    const desde = (acumulado / total) * 360;
    acumulado += p;
    return { desde, hasta: (acumulado / total) * 360 };
  });
}

/**
 * El indicador está fijo arriba (12 en punto). CSS `rotate` gira la rueda
 * en sentido horario, así que el ángulo original bajo el indicador es
 * `(360 - rotación)`.
 */
export function calcularIndiceBajoIndicador(
  rotacionDeg: number,
  n: number,
  pesos?: readonly number[],
): number {
  if (n <= 0) return 0;
  const rot = ((rotacionDeg % 360) + 360) % 360;
  const anguloDesdeArriba = (360 - rot) % 360;
  const limites = limitesGrados(n, pesos);
  const idx = limites.findIndex((l) => anguloDesdeArriba >= l.desde && anguloDesdeArriba < l.hasta);
  return idx < 0 ? 0 : idx;
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
  pesos?: readonly number[],
): number {
  if (n <= 0) return rotacionActual;
  const indice = ((indiceGanador % n) + n) % n;
  const { desde, hasta } = limitesGrados(n, pesos)[indice] ?? { desde: 0, hasta: 360 };
  const centroSector = (desde + hasta) / 2;
  const destinoMod = (360 - centroSector) % 360;
  const actualMod = ((rotacionActual % 360) + 360) % 360;
  let delta = (destinoMod - actualMod + 360) % 360;
  if (delta < 0.5) delta += 360;
  const span = Math.max(vueltasMax - vueltasMin, 0);
  const vueltas = vueltasMin + Math.floor(Math.random() * (span + 1));
  return rotacionActual + vueltas * 360 + delta;
}

/**
 * Índice ganador con probabilidad proporcional al peso. Con pesos iguales equivale
 * a `Math.floor(azar * n)`, que era lo que hacía la ruleta antes de los pesos.
 */
export function elegirGanadorPonderado(
  pesos: readonly number[],
  azar: number = Math.random(),
): number {
  const ps = normalizarPesos(pesos.length, pesos);
  const total = ps.reduce((a, b) => a + b, 0);
  const objetivo = Math.min(Math.max(azar, 0), 0.999999999) * total;
  let acumulado = 0;
  for (let i = 0; i < ps.length; i++) {
    acumulado += ps[i] ?? 1;
    if (objetivo < acumulado) return i;
  }
  return ps.length - 1;
}

/**
 * Parte una etiqueta en líneas de a lo sumo `maxPorLinea` caracteres, cortando por
 * palabras (y por caracteres solo si una palabra no cabe). Si no entra en `maxLineas`,
 * la última línea termina en «…». Una etiqueta corta devuelve una sola línea intacta.
 */
export function dividirEtiqueta(texto: string, maxPorLinea: number, maxLineas: number): string[] {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  if (limpio.length <= maxPorLinea) return [limpio];
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of limpio.split(' ')) {
    let resto = palabra;
    while (resto.length > maxPorLinea) {
      if (actual) {
        lineas.push(actual);
        actual = '';
      }
      lineas.push(resto.slice(0, maxPorLinea));
      resto = resto.slice(maxPorLinea);
    }
    const candidata = actual ? `${actual} ${resto}` : resto;
    if (candidata.length <= maxPorLinea) {
      actual = candidata;
    } else {
      lineas.push(actual);
      actual = resto;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;
  const visibles = lineas.slice(0, maxLineas);
  const ultima = visibles[maxLineas - 1] ?? '';
  visibles[maxLineas - 1] =
    ultima.length >= maxPorLinea ? `${ultima.slice(0, maxPorLinea - 1)}…` : `${ultima}…`;
  return visibles;
}

/** Ángulo (grados) de una `transform` CSS `matrix(a, b, …)`; 0 si no hay matriz. */
export function anguloDeMatriz(transform: string): number {
  const m = /^matrix\(([^)]+)\)$/.exec(transform.trim());
  if (!m) return 0;
  const [a, b] = (m[1] ?? '').split(',').map((v) => Number(v));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (Math.atan2(b ?? 0, a ?? 1) * 180) / Math.PI;
}
