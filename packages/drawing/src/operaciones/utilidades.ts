// ─── Utilidades comunes de las operaciones (W4) ───────────────────────────────
// Todo es puro e inmutable: nada modifica la escena recibida.

import type { Elemento, Escena, Forma, Linea, Texto } from '../tipos.js';
import { ocultosPorColapso } from './colapso.js';

export type ElementoConCaja = Forma | Texto;

export const esConCaja = (e: Elemento): e is ElementoConCaja => e.tipo === 'forma' || e.tipo === 'texto';

export function mapaPorId(escena: Escena): Map<string, Elemento> {
  return new Map(escena.elementos.map((e) => [e.id, e]));
}

/** Para cada hijo de un grupo, el id de su grupo. */
export function mapaPadres(escena: Escena): Map<string, string> {
  const padres = new Map<string, string>();
  for (const e of escena.elementos) {
    if (e.tipo === 'grupo') for (const h of e.hijos) padres.set(h, e.id);
  }
  return padres;
}

/** Grupo más externo que contiene a `id` (o el propio `id` si no está en ningún grupo). */
export function raizDe(id: string, padres: ReadonlyMap<string, string>): string {
  let actual = id;
  // El normalizador garantiza que no hay ciclos; el tope es solo una red de seguridad.
  for (let i = 0; i < 1000; i++) {
    const padre = padres.get(actual);
    if (padre === undefined) return actual;
    actual = padre;
  }
  return actual;
}

/** `ids` más todos los descendientes de los grupos incluidos. Ignora ids que no existen. */
export function expandir(escena: Escena, ids: Iterable<string>): Set<string> {
  const porId = mapaPorId(escena);
  const salida = new Set<string>();
  const visitar = (id: string): void => {
    if (salida.has(id)) return;
    const e = porId.get(id);
    if (!e) return;
    salida.add(id);
    if (e.tipo === 'grupo') e.hijos.forEach(visitar);
  };
  for (const id of ids) visitar(id);
  return salida;
}

/** Quita de `ids` los que ya están contenidos en un grupo que también está en `ids`. */
export function sinDescendientes(escena: Escena, ids: Iterable<string>): string[] {
  const porId = mapaPorId(escena);
  const padres = mapaPadres(escena);
  const pedidos = new Set([...ids].filter((id) => porId.has(id)));
  const salida: string[] = [];
  for (const id of pedidos) {
    let cubierto = false;
    let actual = padres.get(id);
    for (let i = 0; actual !== undefined && i < 1000; i++) {
      if (pedidos.has(actual)) {
        cubierto = true;
        break;
      }
      actual = padres.get(actual);
    }
    if (!cubierto) salida.push(id);
  }
  // Orden de apilado, no el del pedido.
  const orden = new Map(escena.elementos.map((e, i) => [e.id, i]));
  return salida.sort((a, b) => (orden.get(a) ?? 0) - (orden.get(b) ?? 0));
}

/** Ids bloqueados, incluidos los hijos de un grupo bloqueado. */
export function bloqueadosEfectivos(escena: Escena): Set<string> {
  const porId = mapaPorId(escena);
  const salida = new Set<string>();
  const marcar = (id: string): void => {
    if (salida.has(id)) return;
    salida.add(id);
    const e = porId.get(id);
    if (e?.tipo === 'grupo') e.hijos.forEach(marcar);
  };
  for (const e of escena.elementos) if (e.bloqueado) marcar(e.id);
  return salida;
}

/** Ids ocultos, incluidos los hijos de un grupo oculto. */
export function ocultosEfectivos(escena: Escena): Set<string> {
  const porId = mapaPorId(escena);
  const salida = new Set<string>();
  const marcar = (id: string): void => {
    if (salida.has(id)) return;
    salida.add(id);
    const e = porId.get(id);
    if (e?.tipo === 'grupo') e.hijos.forEach(marcar);
  };
  for (const e of escena.elementos) if (e.oculto) marcar(e.id);
  // Lo plegado (Y38a) también está oculto: no se elige, no se alinea, no se organiza.
  for (const id of ocultosPorColapso(escena)) marcar(id);
  return salida;
}

/** Elementos que no son grupos (los que tienen geometría) entre `ids` y sus descendientes, sin los bloqueados. */
export function hojasEditables(escena: Escena, ids: Iterable<string>): Array<ElementoConCaja | Linea> {
  const objetivo = expandir(escena, ids);
  const bloqueados = bloqueadosEfectivos(escena);
  return escena.elementos.filter(
    (e): e is ElementoConCaja | Linea => e.tipo !== 'grupo' && objetivo.has(e.id) && !bloqueados.has(e.id),
  );
}

/** Reemplaza elementos por id (los que no están en `cambios` se conservan con la misma referencia). */
export function conCambios(escena: Escena, cambios: ReadonlyMap<string, Elemento>): Escena {
  if (cambios.size === 0) return escena;
  return { ...escena, elementos: escena.elementos.map((e) => cambios.get(e.id) ?? e) };
}

/** Id nuevo, único en `usados`, derivado de `base` (válido: `[A-Za-z0-9_-]{1,64}`). */
export function idNuevo(base: string, usados: ReadonlySet<string>): string {
  const limpio = base.replace(/[^A-Za-z0-9_-]/g, '').replace(/-copia(-\d+)?$/, '').slice(0, 50) || 'el';
  let candidato = `${limpio}-copia`;
  for (let n = 2; usados.has(candidato); n++) candidato = `${limpio}-copia-${n}`;
  return candidato;
}

/** Id nuevo para un elemento recién creado: `forma-1`, `forma-2`… */
export function idParaTipo(prefijo: string, usados: ReadonlySet<string>): string {
  for (let n = 1; ; n++) {
    const candidato = `${prefijo}-${n}`;
    if (!usados.has(candidato)) return candidato;
  }
}

export const normalizarAngulo = (grados: number): number => {
  const a = ((grados % 360) + 360) % 360;
  return a === 360 ? 0 : a;
};
