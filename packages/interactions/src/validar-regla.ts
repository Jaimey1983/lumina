import type {
  Accion,
  Condicion,
  EventoTipo,
  Operando,
  Regla,
  VariableDef,
} from '@lumina/types/interaction';
import type { ContextoValidacion } from './recolectar.js';
import { CLAVES_SISTEMA, LIMITES_POR_DEFECTO } from './tipos.js';
import type { OrigenRegla } from './tipos.js';
import { tipoDeOperando } from './validar.js';
import type { CodigoError } from './validar.js';

/**
 * Validación de UNA regla con avisos POR CAMPO (N3), para pintarlos junto al
 * control que los causa en el constructor. Es la contraparte fina de
 * `validarReglas` (que valida el mazo al guardar). Pura; no lanza.
 *
 * `campo` es una ruta con puntos sobre la regla: `evento`, `acciones`,
 * `acciones.1.variableId`, `condiciones.0.izquierda`,
 * `condiciones.0.condiciones.2.derecha`, `sino.0.cantidad`…
 */
export interface AvisoCampo {
  campo: string;
  codigo: CodigoError;
  mensaje: string;
}

export interface OpcionesValidarRegla {
  /** Si se conoce, los eventos que el elemento dueño puede emitir. */
  eventosPermitidos?: readonly EventoTipo[];
}

const OPERADORES_TEXTO = new Set(['contiene', 'no_contiene', 'empieza_con', 'termina_con']);

export function validarRegla(
  regla: Regla,
  origen: OrigenRegla,
  ctx: ContextoValidacion,
  opciones: OpcionesValidarRegla = {},
): AvisoCampo[] {
  const avisos: AvisoCampo[] = [];
  const vars = new Map<string, VariableDef>(ctx.variables.map((v) => [v.id, v]));
  const aviso = (campo: string, codigo: CodigoError, mensaje: string): void => {
    avisos.push({ campo, codigo, mensaje });
  };

  const variable = (id: string, campo: string): VariableDef | undefined => {
    if (id === '') {
      aviso(campo, 'variable_invalida', 'Elige una variable.');
      return undefined;
    }
    const def = vars.get(id);
    if (!def) aviso(campo, 'variable_inexistente', 'La variable ya no existe.');
    return def;
  };
  const bloque = (id: string, campo: string): void => {
    if (id === '') aviso(campo, 'bloque_inexistente', 'Elige un elemento.');
    else if (!ctx.bloqueIds.has(id)) aviso(campo, 'bloque_inexistente', 'El elemento ya no existe.');
  };

  const operando = (op: Operando, campo: string): void => {
    switch (op.tipo) {
      case 'variable':
        variable(op.variableId, campo);
        return;
      case 'estado_bloque':
      case 'respuesta_correcta':
        bloque(op.bloqueId, campo);
        return;
      case 'sistema':
        if (!CLAVES_SISTEMA.includes(op.clave)) {
          aviso(campo, 'clave_sistema_invalida', 'Esa variable del sistema no existe.');
        }
        return;
      case 'literal':
        if (typeof op.valor === 'number' && !Number.isFinite(op.valor)) {
          aviso(campo, 'cantidad_invalida', 'Escribe un número válido.');
        }
        return;
    }
  };

  const esNumero = (op: Operando): boolean => {
    const t = tipoDeOperando(op, vars);
    return t === 'numero' || t === 'desconocido';
  };

  const condicion = (c: Condicion, campo: string, prof: number): void => {
    if (prof > LIMITES_POR_DEFECTO.profundidadCondicion) {
      aviso(campo, 'condicion_demasiado_profunda', 'La condición tiene demasiados niveles.');
      return;
    }
    switch (c.tipo) {
      case 'comparacion': {
        operando(c.izquierda, `${campo}.izquierda`);
        operando(c.derecha, `${campo}.derecha`);
        const ta = tipoDeOperando(c.izquierda, vars);
        const tb = tipoDeOperando(c.derecha, vars);
        if (OPERADORES_TEXTO.has(c.operador)) {
          if (ta !== 'texto' && ta !== 'desconocido') {
            aviso(`${campo}.izquierda`, 'tipo_incompatible', `«${c.operador}» solo compara texto.`);
          }
          if (tb !== 'texto' && tb !== 'desconocido') {
            aviso(`${campo}.derecha`, 'tipo_incompatible', `«${c.operador}» solo compara texto.`);
          }
        } else if (c.operador === '==' || c.operador === '!=') {
          if (ta !== 'desconocido' && tb !== 'desconocido' && ta !== tb) {
            aviso(`${campo}.derecha`, 'tipo_incompatible', `Se compara ${ta} con ${tb}.`);
          }
        } else {
          if (!esNumero(c.izquierda)) {
            aviso(`${campo}.izquierda`, 'tipo_incompatible', 'Este operador solo compara números.');
          }
          if (!esNumero(c.derecha)) {
            aviso(`${campo}.derecha`, 'tipo_incompatible', 'Este operador solo compara números.');
          }
        }
        return;
      }
      case 'entre':
        for (const k of ['valor', 'desde', 'hasta'] as const) {
          operando(c[k], `${campo}.${k}`);
          if (!esNumero(c[k])) {
            aviso(`${campo}.${k}`, 'tipo_incompatible', '«entre» solo compara números.');
          }
        }
        return;
      case 'y':
      case 'o':
        c.condiciones.forEach((s, i) => condicion(s, `${campo}.condiciones.${i}`, prof + 1));
        return;
      case 'no':
        condicion(c.condicion, `${campo}.condicion`, prof + 1);
        return;
    }
  };

  const accion = (a: Accion, campo: string): void => {
    switch (a.tipo) {
      case 'ir_a_slide':
        if (a.slideId === '') aviso(`${campo}.slideId`, 'slide_inexistente', 'Elige un slide.');
        else if (!ctx.slideIds.has(a.slideId)) {
          aviso(`${campo}.slideId`, 'slide_inexistente', 'El slide ya no existe.');
        }
        return;
      case 'mostrar':
      case 'ocultar':
      case 'cambiar_estado':
        bloque(a.bloqueId, `${campo}.bloqueId`);
        return;
      case 'abrir_capa':
      case 'cerrar_capa':
        if (a.capaId === '') aviso(`${campo}.capaId`, 'capa_inexistente', 'Elige una capa.');
        else if (!ctx.capaIds.has(a.capaId)) {
          aviso(`${campo}.capaId`, 'capa_inexistente', 'La capa ya no existe.');
        }
        return;
      case 'asignar_variable': {
        const def = variable(a.variableId, `${campo}.variableId`);
        operando(a.valor, `${campo}.valor`);
        const t = tipoDeOperando(a.valor, vars);
        if (def && t !== 'desconocido' && t !== def.tipo) {
          aviso(`${campo}.valor`, 'tipo_incompatible', `«${def.nombre}» es ${def.tipo}: el valor es ${t}.`);
        }
        return;
      }
      case 'sumar_variable': {
        const def = variable(a.variableId, `${campo}.variableId`);
        if (def && def.tipo !== 'numero') {
          aviso(`${campo}.variableId`, 'tipo_incompatible', 'Solo se suma a una variable numérica.');
        }
        if (typeof a.cantidad !== 'number' || !Number.isFinite(a.cantidad)) {
          aviso(`${campo}.cantidad`, 'cantidad_invalida', 'Escribe un número válido.');
        }
        return;
      }
      case 'restar_variable':
      case 'multiplicar_variable':
      case 'dividir_variable': {
        const def = variable(a.variableId, `${campo}.variableId`);
        operando(a.cantidad, `${campo}.cantidad`);
        if (def && def.tipo !== 'numero') {
          aviso(`${campo}.variableId`, 'tipo_incompatible', 'Solo se opera con una variable numérica.');
        }
        if (!esNumero(a.cantidad)) {
          aviso(`${campo}.cantidad`, 'tipo_incompatible', 'La cantidad debe ser un número.');
        }
        if (
          a.tipo === 'dividir_variable' &&
          a.cantidad.tipo === 'literal' &&
          a.cantidad.valor === 0
        ) {
          aviso(`${campo}.cantidad`, 'cantidad_invalida', 'No se puede dividir entre cero.');
        }
        return;
      }
      case 'limpiar_variable':
        variable(a.variableId, `${campo}.variableId`);
        return;
      case 'concatenar_variable': {
        const def = variable(a.variableId, `${campo}.variableId`);
        operando(a.texto, `${campo}.texto`);
        if (def && def.tipo !== 'texto') {
          aviso(`${campo}.variableId`, 'tipo_incompatible', 'Solo se añade texto a una variable de texto.');
        }
        return;
      }
      case 'alternar_variable': {
        const def = variable(a.variableId, `${campo}.variableId`);
        if (def && def.tipo !== 'booleano') {
          aviso(`${campo}.variableId`, 'tipo_incompatible', 'Solo se invierte una variable sí/no.');
        }
        return;
      }
      default:
        return;
    }
  };

  if (opciones.eventosPermitidos && !opciones.eventosPermitidos.includes(regla.evento)) {
    aviso('evento', 'evento_no_soportado', 'Este elemento no emite ese evento.');
  }
  if (origen.tipo === 'bloque' && regla.evento === 'al_entrar_slide') {
    aviso('evento', 'evento_incoherente', '«Al entrar al slide» no lo emite ningún elemento.');
  }
  if (regla.acciones.length === 0 && (regla.sino ?? []).length === 0) {
    aviso('acciones', 'regla_sin_acciones', 'Añade al menos una acción.');
  }
  regla.condiciones.forEach((c, i) => condicion(c, `condiciones.${i}`, 0));
  regla.acciones.forEach((a, i) => accion(a, `acciones.${i}`));
  (regla.sino ?? []).forEach((a, i) => accion(a, `sino.${i}`));

  return avisos;
}
