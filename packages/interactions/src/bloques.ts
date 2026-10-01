import type { Block } from '@lumina/types/slide';

/**
 * Id estable de un bloque, o `undefined` si no tiene.
 *
 * Misma convención que `stableBlockId` del editor (`slide-block-patch.ts`):
 * hoy `id` es OPCIONAL en la unión `Block` (solo lo tienen imagen, video,
 * separador, recorte, gráfico y diagrama); el resto se identifica por su
 * índice en `Slide.bloques`, que NO es estable (cambia al reordenar o
 * borrar). Un bloque sin `id` no puede ser dueño de reglas ni objetivo de
 * ellas. Ver «D8 (propuesta)» en AGENTS.md, Etapa K.
 */
export function idDeBloque(bloque: Block): string | undefined {
  const id = (bloque as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
}
