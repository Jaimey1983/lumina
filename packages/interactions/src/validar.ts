import type {
  Condicion,
  Operando,
  VariableDef,
  VariableTipo,
} from '@lumina/types/interaction';
import { coincideTipo } from './estado.js';
import type { ContextoValidacion } from './recolectar.js';
import { accionesDeRegla } from './reglas.js';
import { CLAVES_SISTEMA, LIMITES_POR_DEFECTO } from './tipos.js';
import type { ReglaAplicable } from './tipos.js';

export type CodigoError =
  | 'variable_duplicada'
  | 'valor_inicial_incoherente'
  | 'regla_duplicada'
  | 'variable_inexistente'
  | 'bloque_inexistente'
  | 'slide_inexistente'
  | 'capa_inexistente'
  | 'tipo_incompatible'
  | 'cantidad_invalida'
  | 'variable_invalida'
  | 'demasiadas_variables'
  | 'condicion_demasiado_profunda'
  | 'evento_incoherente'
  | 'clave_sistema_invalida';

export interface ErrorValidacion {
  codigo: CodigoError;
  mensaje: string;
  reglaId?: string;
  variableId?: string;
}

/** Tipo de un operando, si se conoce sin ejecutar. */
function tipoDeOperando(
  op: Operando,
  vars: ReadonlyMap<string, VariableDef>,
): VariableTipo | 'desconocido' {
  switch (op.tipo) {
    case 'literal':
      return typeof op.valor === 'number'
        ? 'numero'
        : typeof op.valor === 'boolean'
          ? 'booleano'
          : 'texto';
    case 'variable':
      return vars.get(op.variableId)?.tipo ?? 'desconocido';
    case 'estado_bloque':
      return 'texto';
    case 'respuesta_correcta':
      return 'booleano';
    case 'sistema':
      return 'numero';
    default:
      return 'desconocido';
  }
}

/**
 * Validación ESTÁTICA: pensada para correr al guardar (editor y backend) con el
 * mismo código. Devuelve todos los problemas; no lanza. Una referencia a un id
 * que ya no existe (bloque, slide, capa, variable) es un error: es lo que deja
 * una regla rota cuando el docente borra algo (integridad referencial, K7).
 */
export function validarReglas(
  reglas: readonly ReglaAplicable[],
  ctx: ContextoValidacion,
): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  const vars = new Map<string, VariableDef>();

  for (const def of ctx.variables) {
    if (vars.has(def.id)) {
      errores.push({
        codigo: 'variable_duplicada',
        variableId: def.id,
        mensaje: `Hay dos variables con el id «${def.id}».`,
      });
    }
    vars.set(def.id, def);
    if (!coincideTipo(def, def.valorInicial)) {
      errores.push({
        codigo: 'valor_inicial_incoherente',
        variableId: def.id,
        mensaje: `El valor inicial de «${def.nombre}» no es de tipo ${def.tipo}.`,
      });
    }
  }

  const vistas = new Set<string>();

  const refVariable = (id: string, reglaId: string): VariableDef | undefined => {
    const def = vars.get(id);
    if (!def) {
      errores.push({
        codigo: 'variable_inexistente',
        reglaId,
        variableId: id,
        mensaje: `La variable «${id}» no existe.`,
      });
    }
    return def;
  };
  const refBloque = (id: string, reglaId: string): void => {
    if (!ctx.bloqueIds.has(id)) {
      errores.push({
        codigo: 'bloque_inexistente',
        reglaId,
        mensaje: `El bloque «${id}» no existe.`,
      });
    }
  };

  const revisarOperando = (op: Operando, reglaId: string): void => {
    if (op.tipo === 'variable') refVariable(op.variableId, reglaId);
    else if (op.tipo === 'estado_bloque' || op.tipo === 'respuesta_correcta') {
      refBloque(op.bloqueId, reglaId);
    } else if (op.tipo === 'sistema' && !CLAVES_SISTEMA.includes(op.clave)) {
      errores.push({
        codigo: 'clave_sistema_invalida',
        reglaId,
        mensaje: `La variable del sistema «${String(op.clave)}» no existe.`,
      });
    }
  };

  const revisarCondicion = (c: Condicion, reglaId: string, prof: number): void => {
    if (prof > LIMITES_POR_DEFECTO.profundidadCondicion) {
      errores.push({
        codigo: 'condicion_demasiado_profunda',
        reglaId,
        mensaje: `La condición se anida más de ${LIMITES_POR_DEFECTO.profundidadCondicion} niveles.`,
      });
      return;
    }
    switch (c.tipo) {
      case 'comparacion': {
        revisarOperando(c.izquierda, reglaId);
        revisarOperando(c.derecha, reglaId);
        const ta = tipoDeOperando(c.izquierda, vars);
        const tb = tipoDeOperando(c.derecha, vars);
        const esTexto =
          c.operador === 'contiene' ||
          c.operador === 'no_contiene' ||
          c.operador === 'empieza_con' ||
          c.operador === 'termina_con';
        if (esTexto) {
          if (
            (ta !== 'texto' && ta !== 'desconocido') ||
            (tb !== 'texto' && tb !== 'desconocido')
          ) {
            errores.push({
              codigo: 'tipo_incompatible',
              reglaId,
              mensaje: `«${c.operador}» solo compara texto.`,
            });
          }
          return;
        }
        const ordena = c.operador !== '==' && c.operador !== '!=';
        if (ordena && (ta !== 'numero' || tb !== 'numero')) {
          if (ta !== 'desconocido' && tb !== 'desconocido') {
            errores.push({
              codigo: 'tipo_incompatible',
              reglaId,
              mensaje: `«${c.operador}» solo compara números.`,
            });
          }
        } else if (
          !ordena &&
          ta !== 'desconocido' &&
          tb !== 'desconocido' &&
          ta !== tb
        ) {
          errores.push({
            codigo: 'tipo_incompatible',
            reglaId,
            mensaje: `Se compara un valor de tipo ${ta} con uno de tipo ${tb}.`,
          });
        }
        return;
      }
      case 'entre': {
        revisarOperando(c.valor, reglaId);
        revisarOperando(c.desde, reglaId);
        revisarOperando(c.hasta, reglaId);
        for (const op of [c.valor, c.desde, c.hasta]) {
          const t = tipoDeOperando(op, vars);
          if (t !== 'numero' && t !== 'desconocido') {
            errores.push({
              codigo: 'tipo_incompatible',
              reglaId,
              mensaje: '«entre» solo compara números.',
            });
            break;
          }
        }
        return;
      }
      case 'y':
      case 'o':
        for (const sub of c.condiciones) revisarCondicion(sub, reglaId, prof + 1);
        return;
      case 'no':
        revisarCondicion(c.condicion, reglaId, prof + 1);
        return;
      default:
        return;
    }
  };

  for (const { regla, origen } of reglas) {
    if (vistas.has(regla.id)) {
      errores.push({
        codigo: 'regla_duplicada',
        reglaId: regla.id,
        mensaje: `Hay dos reglas con el id «${regla.id}».`,
      });
    }
    vistas.add(regla.id);

    if (origen.tipo === 'bloque') {
      refBloque(origen.bloqueId, regla.id);
      if (regla.evento === 'al_entrar_slide') {
        errores.push({
          codigo: 'evento_incoherente',
          reglaId: regla.id,
          mensaje:
            '«Al entrar al slide» no lo emite ningún bloque: debe ir en las reglas del slide.',
        });
      }
    }
    if (!ctx.slideIds.has(origen.slideId)) {
      errores.push({
        codigo: 'slide_inexistente',
        reglaId: regla.id,
        mensaje: `El slide «${origen.slideId}» no existe.`,
      });
    }

    for (const cond of regla.condiciones) revisarCondicion(cond, regla.id, 0);

    for (const accion of accionesDeRegla(regla)) {
      switch (accion.tipo) {
        case 'ir_a_slide':
          if (!ctx.slideIds.has(accion.slideId)) {
            errores.push({
              codigo: 'slide_inexistente',
              reglaId: regla.id,
              mensaje: `El slide «${accion.slideId}» no existe.`,
            });
          }
          break;
        case 'mostrar':
        case 'ocultar':
        case 'cambiar_estado':
          refBloque(accion.bloqueId, regla.id);
          break;
        case 'abrir_capa':
        case 'cerrar_capa':
          if (!ctx.capaIds.has(accion.capaId)) {
            errores.push({
              codigo: 'capa_inexistente',
              reglaId: regla.id,
              mensaje: `La capa «${accion.capaId}» no existe.`,
            });
          }
          break;
        case 'asignar_variable': {
          const def = refVariable(accion.variableId, regla.id);
          revisarOperando(accion.valor, regla.id);
          const t = tipoDeOperando(accion.valor, vars);
          if (def && t !== 'desconocido' && t !== def.tipo) {
            errores.push({
              codigo: 'tipo_incompatible',
              reglaId: regla.id,
              variableId: def.id,
              mensaje: `No se puede asignar un valor ${t} a «${def.nombre}» (${def.tipo}).`,
            });
          }
          break;
        }
        case 'sumar_variable': {
          const def = refVariable(accion.variableId, regla.id);
          if (def && def.tipo !== 'numero') {
            errores.push({
              codigo: 'tipo_incompatible',
              reglaId: regla.id,
              variableId: def.id,
              mensaje: `Solo se puede sumar a una variable numérica («${def.nombre}» es ${def.tipo}).`,
            });
          }
          if (typeof accion.cantidad !== 'number' || !Number.isFinite(accion.cantidad)) {
            errores.push({
              codigo: 'cantidad_invalida',
              reglaId: regla.id,
              mensaje: 'La cantidad a sumar debe ser un número finito.',
            });
          }
          break;
        }
        default:
          break;
      }
    }
  }

  return errores;
}
