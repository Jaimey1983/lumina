import type { Block } from '@lumina/types/slide';

/**
 * Asignación PEREZOSA de id estable a un bloque (Etapa K / D8, opción (a)).
 *
 * `Block.id` es opcional: los bloques que nunca participan en una regla no lo
 * necesitan y no deben cambiar. Esta función se usa solo cuando un bloque pasa a
 * participar en una regla o a tener un estado distinto de `normal`.
 * Si ya tiene id, devuelve el MISMO objeto (sin copia).
 */
export function asegurarIdBloque<T extends Block>(bloque: T): T {
  const actual = (bloque as { id?: unknown }).id;
  if (typeof actual === 'string' && actual !== '') return bloque;
  return { ...bloque, id: crypto.randomUUID() };
}

/** Id estable del bloque, o `undefined` si todavía no lo tiene. */
export function idDeBloque(bloque: Block): string | undefined {
  const id = (bloque as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
}
