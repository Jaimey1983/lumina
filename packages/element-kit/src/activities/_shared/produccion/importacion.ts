/**
 * U12.2 / DU10 — contrato de los importadores. Un importador convierte filas pegadas en contenido de
 * un tipo de actividad **con las formas de siempre** (mismos campos, ids nuevos): no cambia `tipo`,
 * `ajustes` ni nada que no sea la lista que importa. Nunca pierde filas en silencio: lo que no puede
 * leer vuelve en `descartadas` con su motivo.
 */
import type { Activity } from '@lumina/types/slide';

export type ModoImportacion = 'agregar' | 'reemplazar';

export interface FilaDescartada {
  /** Número de fila tal como la ve el docente (1 = primera fila pegada). */
  readonly fila: number;
  readonly motivo: string;
  readonly texto: string;
}

export interface ResultadoImportacion<A extends Activity = Activity> {
  readonly actividad: A;
  /** Filas que se convirtieron en contenido. */
  readonly leidas: number;
  readonly descartadas: readonly FilaDescartada[];
}

export interface Importador<A extends Activity = Activity> {
  readonly tipo: A['tipo'];
  /** Qué se importa, para el título de la sección: «Preguntas», «Pares»… */
  readonly titulo: string;
  /** Cómo escribir cada fila, en una línea. */
  readonly formato: string;
  /** Texto de ejemplo que se puede pegar tal cual. */
  readonly ejemplo: string;
  /** Primeras celdas que delatan una fila de encabezado (sin acentos, minúsculas). */
  readonly encabezados: readonly string[];
  importar(actividad: A, filas: readonly (readonly string[])[], modo: ModoImportacion): ResultadoImportacion<A>;
}

let contador = 0;
/** Id nuevo y único para un elemento importado. */
export function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}-${contador.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Separa el encabezado (si lo hay) y numera las filas como las ve el docente. */
export function prepararFilas(
  filas: readonly (readonly string[])[],
  encabezados: readonly string[],
  sinAcentos: (s: string) => string,
): { fila: number; celdas: readonly string[] }[] {
  const todas = filas.map((celdas, i) => ({ fila: i + 1, celdas }));
  const primera = todas[0]?.celdas[0];
  if (primera !== undefined && encabezados.includes(sinAcentos(primera))) return todas.slice(1);
  return todas;
}

/** Aplica el modo: «reemplazar» deja solo lo importado; «agregar» lo suma al final. */
export function combinar<T>(actuales: readonly T[], nuevos: readonly T[], modo: ModoImportacion): T[] {
  return modo === 'reemplazar' ? [...nuevos] : [...actuales, ...nuevos];
}

export const celdasConTexto = (celdas: readonly string[]): string[] => celdas.filter((c) => c.trim().length > 0);
