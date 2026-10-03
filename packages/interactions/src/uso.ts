import { accionesDeRegla } from './reglas.js';
import type { Accion, Condicion, Operando } from '@lumina/types/interaction';
import type { ReglaAplicable } from './tipos.js';

export interface UsoDeVariable {
  reglaId: string;
  slideId: string;
  /** Presente si la regla vive en un bloque; ausente si vive en el slide. */
  bloqueId?: string;
}

function operandoUsa(op: Operando, variableId: string): boolean {
  return op.tipo === 'variable' && op.variableId === variableId;
}

function condicionUsa(c: Condicion, variableId: string, prof = 0): boolean {
  // Corte defensivo: una condición absurdamente anidada no cuelga al editor.
  if (prof > 64) return true;
  switch (c.tipo) {
    case 'comparacion':
      return (
        operandoUsa(c.izquierda, variableId) ||
        operandoUsa(c.derecha, variableId)
      );
    case 'entre':
      return (
        operandoUsa(c.valor, variableId) ||
        operandoUsa(c.desde, variableId) ||
        operandoUsa(c.hasta, variableId)
      );
    case 'y':
    case 'o':
      return c.condiciones.some((x) => condicionUsa(x, variableId, prof + 1));
    case 'no':
      return condicionUsa(c.condicion, variableId, prof + 1);
    default:
      return false;
  }
}

function accionUsa(a: Accion, variableId: string): boolean {
  switch (a.tipo) {
    case 'asignar_variable':
      return a.variableId === variableId || operandoUsa(a.valor, variableId);
    case 'sumar_variable':
    case 'limpiar_variable':
    case 'alternar_variable':
      return a.variableId === variableId;
    case 'restar_variable':
    case 'multiplicar_variable':
    case 'dividir_variable':
      return a.variableId === variableId || operandoUsa(a.cantidad, variableId);
    case 'concatenar_variable':
      return a.variableId === variableId || operandoUsa(a.texto, variableId);
    default:
      return false;
  }
}

/**
 * Reglas que referencian una variable (en una condición o en una acción).
 * Pura. La usa el editor para IMPEDIR borrar una variable en uso y decir dónde
 * se usa (D13: nunca se deja una regla huérfana en silencio).
 */
export function usosDeVariable(
  reglas: readonly ReglaAplicable[],
  variableId: string,
): UsoDeVariable[] {
  const usos: UsoDeVariable[] = [];
  for (const { regla, origen } of reglas) {
    const usa =
      (regla.evento === 'cambio_variable' && regla.parametro === variableId) ||
      regla.condiciones.some((c) => condicionUsa(c, variableId)) ||
      accionesDeRegla(regla).some((a) => accionUsa(a, variableId));
    if (!usa) continue;
    usos.push({
      reglaId: regla.id,
      slideId: origen.slideId,
      ...(origen.tipo === 'bloque' ? { bloqueId: origen.bloqueId } : {}),
    });
  }
  return usos;
}
