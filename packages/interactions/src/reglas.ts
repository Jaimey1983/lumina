import type { Accion, Regla } from '@lumina/types/interaction';

/**
 * Todas las acciones de una regla: las del camino «sí» y las de «si no» (N1).
 * Cualquier recorrido que busque referencias (integridad, uso de variables,
 * validación) debe usar esto, o dejará `sino` sin revisar.
 */
export function accionesDeRegla(r: Regla): readonly Accion[] {
  return r.sino !== undefined && r.sino.length > 0
    ? [...r.acciones, ...r.sino]
    : r.acciones;
}
