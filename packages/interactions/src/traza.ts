import type { Condicion, Operando, VariableValor } from '@lumina/types/interaction';
import { evaluarOperando } from './condiciones.js';
import type { CtxEvaluacion } from './condiciones.js';
import { evaluarCondicion } from './condiciones.js';
import { describirCondicion, describirOperando } from './describir.js';
import type { ContextoDescripcion } from './describir.js';
import type { EstadoMotor } from './tipos.js';

/**
 * N8 — explicación de por qué una condición dio falso. PURO y solo se usa con la
 * traza encendida: evalúa de nuevo con un contexto descartable (sus avisos no se
 * mezclan con los del motor) y no toca el estado.
 */

/** Descripción por defecto: sin nombres, se escribe el id. */
export const DESCRIPCION_POR_IDS: ContextoDescripcion = {
  nombreVariable: (id) => id,
  nombreBloque: (id) => id,
  tituloSlide: (id) => id,
  nombreCapa: (id) => id,
};

const texto = (v: VariableValor | undefined): string => {
  if (v === undefined) return 'sin valor';
  if (typeof v === 'string') return `«${v}»`;
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  return String(v);
};

function valorDe(op: Operando, estado: EstadoMotor, base: CtxEvaluacion): VariableValor | undefined {
  const ctx: CtxEvaluacion = { avisos: [], profundidadMax: base.profundidadMax, ...(base.sistema ? { sistema: base.sistema } : {}) };
  return evaluarOperando(op, estado, ctx);
}

/** «(«intentos» vale 2; 3 vale 3)» — solo los operandos que no son un literal. */
function valores(c: Condicion, estado: EstadoMotor, base: CtxEvaluacion, d: ContextoDescripcion): string {
  const ops: Operando[] =
    c.tipo === 'comparacion'
      ? [c.izquierda, c.derecha]
      : c.tipo === 'entre'
        ? [c.valor, c.desde, c.hasta]
        : [];
  const partes = ops
    .filter((o) => o.tipo !== 'literal')
    .map((o) => `${describirOperando(o, d)} vale ${texto(valorDe(o, estado, base))}`);
  return partes.length > 0 ? ` (${partes.join('; ')})` : '';
}

function cumple(c: Condicion, estado: EstadoMotor, base: CtxEvaluacion): boolean {
  return evaluarCondicion(c, estado, {
    avisos: [],
    profundidadMax: base.profundidadMax,
    ...(base.sistema ? { sistema: base.sistema } : {}),
  });
}

/** La primera condición «hoja» (o `o`/`no`) que explica el falso. */
function culpable(c: Condicion, estado: EstadoMotor, base: CtxEvaluacion): Condicion {
  if (c.tipo === 'y') {
    const falsa = c.condiciones.find((s) => !cumple(s, estado, base));
    return falsa ? culpable(falsa, estado, base) : c;
  }
  return c;
}

/** `null` si todas se cumplen. */
export function explicarFalla(
  condiciones: readonly Condicion[],
  estado: EstadoMotor,
  base: CtxEvaluacion,
  d: ContextoDescripcion,
): string | null {
  const falsa = condiciones.find((c) => !cumple(c, estado, base));
  if (!falsa) return null;
  const c = culpable(falsa, estado, base);
  return `no se cumple que ${describirCondicion(c, d)}${valores(c, estado, base, d)}`;
}
