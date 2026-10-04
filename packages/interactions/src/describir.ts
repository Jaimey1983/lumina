import type {
  Accion,
  Condicion,
  EstadoObjeto,
  EventoTipo,
  Operando,
  OperadorComparacion,
  Regla,
  VariableValor,
} from '@lumina/types/interaction';
import { esSegundosValidos, esTeclaPermitida, etiquetaTecla } from './eventos.js';
import { accionesDeRegla } from './reglas.js';

/**
 * Texto en español de una regla (N3). PURO: lo usan las tarjetas del panel
 * «Interacciones» y, más adelante, el simulador (N8). Nombra variables, bloques,
 * slides y capas con los nombres que ve el docente; una referencia que ya no
 * existe se escribe «(eliminado)» y nunca el id crudo.
 */

export interface ContextoDescripcion {
  /** Nombre de una variable por su id, o `undefined` si ya no existe. */
  nombreVariable(id: string): string | undefined;
  nombreBloque(id: string): string | undefined;
  tituloSlide(id: string): string | undefined;
  nombreCapa(id: string): string | undefined;
  /** N6 — nombre de un estado personalizado de un bloque (opcional). */
  nombreEstado?(bloqueId: string, estadoId: string): string | undefined;
}

export const ELIMINADO = '(eliminado)';

const EVENTOS: Record<EventoTipo, string> = {
  clic: 'se hace clic',
  visitado: 'se visita',
  seleccionado: 'se selecciona',
  respuesta_correcta: 'se responde bien',
  respuesta_incorrecta: 'se responde mal',
  fin_contador: 'termina el contador',
  al_entrar_slide: 'se entra al slide',
  cambio_variable: 'cambia una variable',
  hover_entra: 'el puntero entra en el elemento',
  hover_sale: 'el puntero sale del elemento',
  tecla: 'se pulsa una tecla',
  temporizador: 'pasa un tiempo en el slide',
  salir_slide: 'se sale del slide',
  media_inicia: 'empieza la reproducción',
  media_termina: 'termina la reproducción',
};

/** Texto del disparador, con su parámetro cuando lo tiene (N5). */
export function describirEvento(r: Pick<Regla, 'evento' | 'parametro'>, ctx: ContextoDescripcion): string {
  const p = r.parametro;
  if (r.evento === 'cambio_variable') {
    const nombre = typeof p === 'string' ? (ctx.nombreVariable(p) ?? ELIMINADO) : '…';
    return `cambia la variable «${nombre}»`;
  }
  if (r.evento === 'tecla') {
    return typeof p === 'string' && esTeclaPermitida(p)
      ? `se pulsa la tecla ${etiquetaTecla(p)}`
      : EVENTOS.tecla;
  }
  if (r.evento === 'temporizador') {
    return typeof p === 'number' && esSegundosValidos(p)
      ? `pasan ${p} ${p === 1 ? 'segundo' : 'segundos'} en el slide`
      : EVENTOS.temporizador;
  }
  return EVENTOS[r.evento];
}

export function nombreEvento(e: EventoTipo): string {
  return EVENTOS[e];
}

const ESTADOS: Record<EstadoObjeto, string> = {
  normal: 'normal',
  visitado: 'visitado',
  seleccionado: 'seleccionado',
  deshabilitado: 'deshabilitado',
};

export const CLAVES_SISTEMA_ETIQUETA = {
  slide_numero: 'el número de slide',
  slide_total: 'el total de slides',
  progreso_pct: 'el progreso (%)',
  tiempo_s: 'el tiempo transcurrido (s)',
  intento: 'el número de intento',
} as const;

const OPERADORES: Record<OperadorComparacion, string> = {
  '==': 'es igual a',
  '!=': 'es distinto de',
  '<': 'es menor que',
  '<=': 'es menor o igual que',
  '>': 'es mayor que',
  '>=': 'es mayor o igual que',
  contiene: 'contiene',
  no_contiene: 'no contiene',
  empieza_con: 'empieza con',
  termina_con: 'termina con',
};

export function nombreOperador(o: OperadorComparacion): string {
  return OPERADORES[o];
}

function valorLiteral(v: VariableValor): string {
  if (typeof v === 'string') return `«${v}»`;
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  return String(v);
}

export function describirOperando(op: Operando, ctx: ContextoDescripcion): string {
  switch (op.tipo) {
    case 'literal':
      return valorLiteral(op.valor);
    case 'variable':
      return `«${ctx.nombreVariable(op.variableId) ?? ELIMINADO}»`;
    case 'estado_bloque':
      return `el estado de ${ctx.nombreBloque(op.bloqueId) ?? ELIMINADO}`;
    case 'respuesta_correcta':
      return `la respuesta de ${ctx.nombreBloque(op.bloqueId) ?? ELIMINADO}`;
    case 'sistema':
      return CLAVES_SISTEMA_ETIQUETA[op.clave] ?? ELIMINADO;
  }
}

/** Condición con paréntesis solo donde hace falta. `y`/`o` vacío se escribe aparte. */
export function describirCondicion(c: Condicion, ctx: ContextoDescripcion, anidada = false): string {
  switch (c.tipo) {
    case 'comparacion':
      return `${describirOperando(c.izquierda, ctx)} ${OPERADORES[c.operador]} ${describirOperando(c.derecha, ctx)}`;
    case 'entre':
      return `${describirOperando(c.valor, ctx)} está entre ${describirOperando(c.desde, ctx)} y ${describirOperando(c.hasta, ctx)}`;
    case 'y':
    case 'o': {
      const union = c.tipo === 'y' ? ' y ' : ' o ';
      if (c.condiciones.length === 0) return c.tipo === 'y' ? 'siempre' : 'nunca';
      const txt = c.condiciones.map((s) => describirCondicion(s, ctx, true)).join(union);
      return anidada && c.condiciones.length > 1 ? `(${txt})` : txt;
    }
    case 'no':
      return `no se cumple que ${describirCondicion(c.condicion, ctx, true)}`;
  }
}

export function describirAccion(a: Accion, ctx: ContextoDescripcion): string {
  const v = (id: string): string => `«${ctx.nombreVariable(id) ?? ELIMINADO}»`;
  const b = (id: string): string => ctx.nombreBloque(id) ?? ELIMINADO;
  switch (a.tipo) {
    case 'ir_a_slide':
      return `ir a ${ctx.tituloSlide(a.slideId) ?? ELIMINADO}`;
    case 'siguiente':
      return 'ir al siguiente slide';
    case 'anterior':
      return 'volver al slide anterior';
    case 'mostrar':
      return `mostrar ${b(a.bloqueId)}`;
    case 'ocultar':
      return `ocultar ${b(a.bloqueId)}`;
    case 'cambiar_estado':
      return `poner ${b(a.bloqueId)} en «${
        (Object.hasOwn(ESTADOS, a.estado)
          ? ESTADOS[a.estado as EstadoObjeto]
          : ctx.nombreEstado?.(a.bloqueId, a.estado)) ?? ELIMINADO
      }»`;
    case 'abrir_capa':
      return `abrir la capa «${ctx.nombreCapa(a.capaId) ?? ELIMINADO}»`;
    case 'cerrar_capa':
      return `cerrar la capa «${ctx.nombreCapa(a.capaId) ?? ELIMINADO}»`;
    case 'asignar_variable':
      return `asignar a ${v(a.variableId)} ${describirOperando(a.valor, ctx)}`;
    case 'sumar_variable':
      return `sumar ${a.cantidad} a ${v(a.variableId)}`;
    case 'restar_variable':
      return `restar ${describirOperando(a.cantidad, ctx)} a ${v(a.variableId)}`;
    case 'multiplicar_variable':
      return `multiplicar ${v(a.variableId)} por ${describirOperando(a.cantidad, ctx)}`;
    case 'dividir_variable':
      return `dividir ${v(a.variableId)} entre ${describirOperando(a.cantidad, ctx)}`;
    case 'limpiar_variable':
      return `reiniciar ${v(a.variableId)}`;
    case 'concatenar_variable':
      return `añadir ${describirOperando(a.texto, ctx)} al final de ${v(a.variableId)}`;
    case 'alternar_variable':
      return `invertir ${v(a.variableId)} (sí/no)`;
  }
}

const unir = (xs: readonly string[]): string => xs.join(', ');

/**
 * «Cuando se hace clic → si «intentos» es mayor o igual que 3 o … → mostrar X;
 * si no → sumar 1 a «intentos»».
 */
export function describirRegla(r: Regla, ctx: ContextoDescripcion): string {
  const acciones = r.acciones.map((a) => describirAccion(a, ctx));
  const sino = (r.sino ?? []).map((a) => describirAccion(a, ctx));
  const cuando = `Cuando ${describirEvento(r, ctx)}`;
  const cond =
    r.condiciones.length === 0
      ? null
      : r.condiciones.map((c) => describirCondicion(c, ctx, r.condiciones.length > 1)).join(' y ');

  let texto = cuando;
  if (cond !== null) texto += ` → si ${cond}`;
  texto += ` → ${acciones.length > 0 ? unir(acciones) : 'no hace nada'}`;
  if (sino.length > 0) texto += `; si no → ${unir(sino)}`;
  return r.activa ? texto : `${texto} (desactivada)`;
}

/** Cuenta las acciones de la regla (para decidir si una tarjeta está vacía). */
export function totalAcciones(r: Regla): number {
  return accionesDeRegla(r).length;
}
