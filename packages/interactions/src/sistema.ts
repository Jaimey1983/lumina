import type { ClaveSistema } from '@lumina/types/interaction';
import type { EstadoMotor } from './tipos.js';

/**
 * Variables del sistema de solo lectura (Etapa N / N7, D18). Todo aquí es puro y
 * derivado: NO se declara en `Class.variables`, NO se persiste como variable y
 * NINGUNA clave es nota, puntaje, banda ni resultado de actividad (C1/C4; eso
 * sería N10 y exige reabrir D9).
 *
 * Lo único que viaja en el estado persistido (K5) son dos marcas dentro de
 * `visibles`, igual que las de K8a y N5: «este slide ya se visitó» y «segundos
 * activos acumulados». Con ellas `progreso_pct` y `tiempo_s` sobreviven a una
 * recarga sin guardar nada nuevo en el backend.
 */

const MARCA_VISITADO = '\u001c';
const MARCA_TIEMPO = '\u001d';

/** Tope de segundos que se aceptan al leer (JSON editable): 7 días. */
export const TIEMPO_MAX_S = 7 * 24 * 3600;

/** Marca de «slide visitado en este intento» (no es la de siembra de K8a). */
export function marcaDeVisitado(slideId: string): string {
  return `${MARCA_VISITADO}${slideId}`;
}

/** Cuántos de estos slides ya se visitaron en este intento. */
export function slidesVisitados(
  estado: Pick<EstadoMotor, 'visibles'>,
  slideIds: readonly string[],
): number {
  let n = 0;
  for (const id of new Set(slideIds)) {
    if (estado.visibles[marcaDeVisitado(id)] === true) n += 1;
  }
  return n;
}

/** Segundos activos acumulados que dejó la última escritura (0 si no hay marca). */
export function tiempoActivoPersistido(estado: Pick<EstadoMotor, 'visibles'>): number {
  let mejor = 0;
  for (const clave of Object.keys(estado.visibles)) {
    if (!clave.startsWith(MARCA_TIEMPO)) continue;
    const texto = clave.slice(MARCA_TIEMPO.length);
    if (!/^\d{1,7}$/.test(texto)) continue;
    const n = Number(texto);
    if (n > mejor && n <= TIEMPO_MAX_S) mejor = n;
  }
  return mejor;
}

/**
 * Estado nuevo con los segundos activos sellados (reemplaza la marca anterior).
 * Si no cambia nada devuelve el MISMO objeto, para no provocar escrituras.
 */
export function conTiempoActivo(estado: EstadoMotor, segundos: number): EstadoMotor {
  const s = Math.min(TIEMPO_MAX_S, Math.max(0, Math.floor(Number.isFinite(segundos) ? segundos : 0)));
  const clave = `${MARCA_TIEMPO}${s}`;
  const existentes = Object.keys(estado.visibles).filter((k) => k.startsWith(MARCA_TIEMPO));
  if (existentes.length === 1 && existentes[0] === clave) return estado;
  if (existentes.length === 0 && s === 0) return estado;
  const visibles: Record<string, boolean> = Object.create(null) as Record<string, boolean>;
  for (const k of Object.keys(estado.visibles)) {
    if (!k.startsWith(MARCA_TIEMPO)) visibles[k] = estado.visibles[k] as boolean;
  }
  visibles[clave] = true;
  return { ...estado, visibles };
}

export interface EntradaSistema {
  estado: Pick<EstadoMotor, 'visibles'>;
  /** Slides del mazo, en orden. */
  slideIds: readonly string[];
  /** Slide donde ocurre la evaluación. */
  slideId: string | undefined;
  /** Segundos activos del intento (sin contar la pestaña oculta). */
  tiempoActivoS: number;
  /** Número de intento (1-based). */
  intento: number;
}

/**
 * Valores de las cinco claves de D18. Una clave sin dato fiable se OMITE: el
 * evaluador falla cerrado (la regla no dispara y deja `sistema_no_disponible`).
 */
export function calcularSistema(e: EntradaSistema): Partial<Record<ClaveSistema, number>> {
  const out: Partial<Record<ClaveSistema, number>> = {};
  const total = e.slideIds.length;
  if (total > 0) {
    out.slide_total = total;
    const i = e.slideId === undefined ? -1 : e.slideIds.indexOf(e.slideId);
    if (i >= 0) out.slide_numero = i + 1;
    const visitados = slidesVisitados(e.estado, e.slideIds);
    out.progreso_pct = Math.min(100, Math.round((100 * visitados) / new Set(e.slideIds).size));
  }
  if (Number.isFinite(e.tiempoActivoS)) out.tiempo_s = Math.max(0, Math.floor(e.tiempoActivoS));
  if (Number.isInteger(e.intento) && e.intento >= 1) out.intento = e.intento;
  return out;
}
