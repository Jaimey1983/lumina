import type { VariableDef } from '@lumina/types/interaction';
import { coincideTipo } from './estado.js';
import type { ErrorValidacion } from './validar.js';

/** Tope de variables por clase (K6). */
export const MAX_VARIABLES = 50;
/** Tope de caracteres del nombre y de un valor de texto. */
export const MAX_TEXTO_VARIABLE = 200;

/**
 * Validación de la DECLARACIÓN de variables (K6). Pura; la usan el editor y el
 * backend (mismo código) antes de persistir `Class.variables`. No lanza.
 * Complementa a `validarReglas`, que revisa las reglas contra las variables.
 */
export function validarVariables(defs: readonly VariableDef[]): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  if (defs.length > MAX_VARIABLES) {
    errores.push({
      codigo: 'demasiadas_variables',
      mensaje: `Una clase admite como máximo ${MAX_VARIABLES} variables.`,
    });
  }
  const ids = new Set<string>();
  const nombres = new Set<string>();
  for (const def of defs) {
    const id = typeof def.id === 'string' ? def.id.trim() : '';
    if (id === '') {
      errores.push({ codigo: 'variable_invalida', mensaje: 'Una variable no tiene id.' });
    } else if (ids.has(id)) {
      errores.push({
        codigo: 'variable_duplicada',
        variableId: id,
        mensaje: `Hay dos variables con el id «${id}».`,
      });
    }
    ids.add(id);

    const nombre = typeof def.nombre === 'string' ? def.nombre.trim() : '';
    if (nombre === '' || nombre.length > MAX_TEXTO_VARIABLE) {
      errores.push({
        codigo: 'variable_invalida',
        variableId: id,
        mensaje: `El nombre de la variable debe tener entre 1 y ${MAX_TEXTO_VARIABLE} caracteres.`,
      });
    } else if (nombres.has(nombre.toLowerCase())) {
      errores.push({
        codigo: 'variable_duplicada',
        variableId: id,
        mensaje: `Hay dos variables llamadas «${nombre}».`,
      });
    }
    nombres.add(nombre.toLowerCase());

    if (def.tipo !== 'numero' && def.tipo !== 'texto' && def.tipo !== 'booleano') {
      errores.push({
        codigo: 'variable_invalida',
        variableId: id,
        mensaje: `El tipo de «${nombre}» no es válido.`,
      });
      continue;
    }
    if (!coincideTipo(def, def.valorInicial)) {
      errores.push({
        codigo: 'valor_inicial_incoherente',
        variableId: id,
        mensaje: `El valor inicial de «${nombre}» no es de tipo ${def.tipo}.`,
      });
    } else if (
      typeof def.valorInicial === 'string' &&
      def.valorInicial.length > MAX_TEXTO_VARIABLE
    ) {
      errores.push({
        codigo: 'variable_invalida',
        variableId: id,
        mensaje: `El valor de «${nombre}» supera ${MAX_TEXTO_VARIABLE} caracteres.`,
      });
    }
  }
  return errores;
}
