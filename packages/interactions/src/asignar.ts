import type { VariableDef, VariableValor } from '@lumina/types/interaction';
import { coincideTipo } from './estado.js';
import { MAX_TEXTO_VARIABLE } from './variables.js';
import type { EstadoMotor } from './tipos.js';

/**
 * Asigna una variable DESDE UN ELEMENTO (p. ej. los ajustadores de una fórmula),
 * sin pasar por una regla. Es la misma garantía que el validador de K5: la
 * variable debe existir, el tipo debe coincidir y el texto está acotado.
 *
 * Solo toca `variables` (flujo; C1/C4): nunca una nota. Pura: devuelve el MISMO
 * objeto si la asignación no es válida o no cambia nada, para que el llamador
 * pueda omitir el guardado.
 */
export function asignarVariable(
  estado: EstadoMotor,
  variables: readonly VariableDef[],
  variableId: string,
  valor: VariableValor,
): EstadoMotor {
  const def = variables.find((v) => v.id === variableId);
  if (!def) return estado;
  if (!coincideTipo(def, valor)) return estado;
  if (typeof valor === 'string' && valor.length > MAX_TEXTO_VARIABLE) return estado;
  if (Object.hasOwn(estado.variables, variableId) && estado.variables[variableId] === valor) {
    return estado;
  }
  const siguientes: Record<string, VariableValor> = Object.create(null) as Record<
    string,
    VariableValor
  >;
  for (const k of Object.keys(estado.variables)) siguientes[k] = estado.variables[k] as VariableValor;
  siguientes[variableId] = valor;
  return { ...estado, variables: siguientes };
}
