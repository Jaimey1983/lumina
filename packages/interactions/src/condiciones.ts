import type {
  Condicion,
  OperadorComparacion,
  Operando,
  VariableValor,
} from '@lumina/types/interaction';
import { leer } from './estado.js';
import type { Aviso, EstadoMotor } from './tipos.js';

/** Contexto de evaluación. `avisos` se llena sin lanzar nunca (D5: entrada no confiable). */
export interface CtxEvaluacion {
  avisos: Aviso[];
  profundidadMax: number;
  reglaId?: string;
  /**
   * Uso interno. Se activa cuando CUALQUIER parte visitada de la condición no
   * se pudo evaluar (variable inexistente, tipos incompatibles, demasiado
   * profunda). Una condición rota hace falsa la regla ENTERA, sea cual sea su
   * posición: si solo devolviera «falso» en esa rama, un `no` la volvería
   * verdadera y una regla rota se dispararía sola (falla cerrado).
   */
  rota?: boolean;
}

export function evaluarOperando(
  op: Operando,
  estado: EstadoMotor,
  ctx: CtxEvaluacion,
): VariableValor | undefined {
  switch (op.tipo) {
    case 'literal':
      return op.valor;
    case 'variable': {
      const v = leer(estado.variables, op.variableId);
      if (v === undefined) {
        ctx.rota = true;
        ctx.avisos.push({
          codigo: 'variable_inexistente',
          reglaId: ctx.reglaId,
          mensaje: `La variable «${op.variableId}» no existe.`,
        });
      }
      return v;
    }
    case 'estado_bloque':
      return leer(estado.estados, op.bloqueId) ?? 'normal';
    case 'respuesta_correcta':
      // Sin respuesta registrada se considera `false`: solo reglas disparadas
      // por un evento pueden llegar aquí, y ya habrán registrado la respuesta.
      return leer(estado.respuestas, op.bloqueId) ?? false;
    default:
      return undefined;
  }
}

function comparar(
  operador: OperadorComparacion,
  a: VariableValor,
  b: VariableValor,
): boolean | 'incompatible' {
  if (operador === '==') return a === b;
  if (operador === '!=') return a !== b;
  // Orden (<, <=, >, >=): solo entre números finitos.
  if (
    typeof a !== 'number' ||
    typeof b !== 'number' ||
    !Number.isFinite(a) ||
    !Number.isFinite(b)
  ) {
    return 'incompatible';
  }
  switch (operador) {
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    default:
      return 'incompatible';
  }
}

function evaluar(
  cond: Condicion,
  estado: EstadoMotor,
  ctx: CtxEvaluacion,
  profundidad: number,
): boolean {
  if (profundidad > ctx.profundidadMax) {
    ctx.rota = true;
    ctx.avisos.push({
      codigo: 'condicion_demasiado_profunda',
      reglaId: ctx.reglaId,
      mensaje: `Condición anidada más de ${ctx.profundidadMax} niveles: se evalúa como falsa.`,
    });
    return false;
  }
  switch (cond.tipo) {
    case 'comparacion': {
      const a = evaluarOperando(cond.izquierda, estado, ctx);
      const b = evaluarOperando(cond.derecha, estado, ctx);
      // Un operando inexistente (variable borrada) deja la condición rota
      // (ver `CtxEvaluacion.rota`), también con `!=`.
      if (a === undefined || b === undefined) {
        ctx.rota = true;
        return false;
      }
      const r = comparar(cond.operador, a, b);
      if (r === 'incompatible') {
        ctx.rota = true;
        ctx.avisos.push({
          codigo: 'tipo_incompatible',
          reglaId: ctx.reglaId,
          mensaje: `«${cond.operador}» solo compara números; se evalúa como falsa.`,
        });
        return false;
      }
      return r;
    }
    case 'y':
      // `y` vacío es verdadero (elemento neutro).
      return cond.condiciones.every((c) =>
        evaluar(c, estado, ctx, profundidad + 1),
      );
    case 'o':
      // `o` vacío es falso (elemento neutro).
      return cond.condiciones.some((c) =>
        evaluar(c, estado, ctx, profundidad + 1),
      );
    case 'no':
      return !evaluar(cond.condicion, estado, ctx, profundidad + 1);
    default:
      return false;
  }
}

export function evaluarCondicion(
  cond: Condicion,
  estado: EstadoMotor,
  ctx: CtxEvaluacion = { avisos: [], profundidadMax: 16 },
): boolean {
  ctx.rota = false;
  const resultado = evaluar(cond, estado, ctx, 0);
  return resultado && !ctx.rota;
}

/** Lista de condiciones con Y implícito. Lista vacía = verdadero. */
export function evaluarCondiciones(
  condiciones: readonly Condicion[],
  estado: EstadoMotor,
  ctx: CtxEvaluacion,
): boolean {
  ctx.rota = false;
  const resultado = condiciones.every((c) => evaluar(c, estado, ctx, 0));
  return resultado && !ctx.rota;
}
