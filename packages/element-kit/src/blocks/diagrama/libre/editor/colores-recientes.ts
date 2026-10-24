// ─── Colores recientes (Y22) ──────────────────────────────────────────────────
// Los últimos colores que una persona eligió a mano. Son una preferencia del navegador (DY15, DY26): no van en la
// escena ni se exportan. La lista es pura; solo `leerRecientes`/`guardarRecientes` tocan `localStorage`, siempre con
// `try/catch` (sin almacenamiento el selector funciona igual, solo no recuerda).

import { esColorValido } from "@lumina/drawing";

export const MAX_RECIENTES = 8;
export const CLAVE_RECIENTES = "lumina.dibujo.colores-recientes";

const esToken = (c: string): boolean => c.startsWith("var(");

/** Hex en mayúsculas; `null` si no es un color que valga la pena recordar (vacío, inválido o token del tema). */
function normalizar(color: unknown): string | null {
  if (typeof color !== "string") return null;
  const limpio = color.trim();
  if (!esColorValido(limpio) || esToken(limpio)) return null;
  return limpio.toUpperCase();
}

/**
 * La lista con `color` primero. Devuelve **la misma lista** si no hay nada que registrar: color vacío, inválido, un token
 * del tema (sigue al modo claro y oscuro), un color que ya está a un clic (`ofrecidos`, DY27) o el que ya va primero.
 */
export function registrarReciente(lista: readonly string[], color: string, ofrecidos: readonly string[]): readonly string[] {
  const nuevo = normalizar(color);
  if (nuevo === null) return lista;
  if (ofrecidos.some((o) => o.toUpperCase() === nuevo)) return lista;
  if (lista[0] === nuevo) return lista;
  return [nuevo, ...lista.filter((c) => c !== nuevo)].slice(0, MAX_RECIENTES);
}

/** Lo guardado, validado elemento a elemento (puede venir de otra versión o estar manipulado). Vacía ante cualquier fallo. */
export function leerRecientes(): readonly string[] {
  try {
    const crudo = globalThis.localStorage.getItem(CLAVE_RECIENTES);
    if (crudo === null) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    const salida: string[] = [];
    for (const d of datos) {
      const c = normalizar(d);
      if (c !== null && !salida.includes(c)) salida.push(c);
    }
    return salida.slice(0, MAX_RECIENTES);
  } catch {
    return [];
  }
}

export function guardarRecientes(lista: readonly string[]): void {
  try {
    globalThis.localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista));
  } catch {
    /* sin almacenamiento o cuota llena: el selector funciona igual, solo no recuerda */
  }
}

/** Registra `color` en lo guardado. Devuelve la lista resultante. */
export function registrarEnAlmacen(color: string, ofrecidos: readonly string[]): readonly string[] {
  const antes = leerRecientes();
  const despues = registrarReciente(antes, color, ofrecidos);
  if (despues !== antes) guardarRecientes(despues);
  return despues;
}
