import type {
  Accion,
  EstadoObjeto,
  EventoTipo,
  VariableDef,
} from '@lumina/types/interaction';
import { evaluarCondiciones, evaluarOperando } from './condiciones.js';
import type { CtxEvaluacion } from './condiciones.js';
import { clonarEstado, coincideTipo, leer } from './estado.js';
import type { EstadoTrabajo } from './estado.js';
import { LIMITES_POR_DEFECTO } from './tipos.js';
import type {
  Aviso,
  ContextoMotor,
  Efecto,
  EstadoMotor,
  EventoMotor,
  LimitesMotor,
  ReglaAplicable,
  ResultadoMotor,
} from './tipos.js';

function coincideEvento(ra: ReglaAplicable, ev: EventoMotor): boolean {
  if (ra.regla.evento !== ev.tipo) return false;
  if (ra.origen.tipo === 'bloque') {
    return ev.bloqueId !== undefined && ev.bloqueId === ra.origen.bloqueId;
  }
  // Regla de slide: reacciona a todo lo que ocurre en su slide.
  return ev.slideId !== undefined && ev.slideId === ra.origen.slideId;
}

/** `visitado` y `seleccionado` también son estados de objeto. */
function estadoDeEvento(tipo: EventoTipo): EstadoObjeto | undefined {
  if (tipo === 'visitado') return 'visitado';
  if (tipo === 'seleccionado') return 'seleccionado';
  return undefined;
}

/** Inverso de `estadoDeEvento`: entrar a ese estado emite ese evento. */
function eventoDeEstado(estado: EstadoObjeto): EventoTipo | undefined {
  if (estado === 'visitado') return 'visitado';
  if (estado === 'seleccionado') return 'seleccionado';
  return undefined;
}

interface Corrida {
  w: EstadoTrabajo;
  defs: Map<string, VariableDef>;
  efectos: Efecto[];
  avisos: Aviso[];
  cola: { evento: EventoMotor; profundidad: number }[];
  accionesRestantes: number;
  navegacionEmitida: boolean;
  /** Se detuvo todo el procesamiento (límite de acciones). */
  abortada: boolean;
}

/**
 * Aplica el evento ENTRANTE al estado de trabajo, antes de evaluar reglas:
 *  - `respuesta_correcta` / `respuesta_incorrecta` registran el resultado.
 *  - `visitado` / `seleccionado` actualizan el estado del bloque (un bloque
 *    `deshabilitado` no cambia; `visitado` no degrada a un `seleccionado`).
 */
function sincronizarEntrada(ev: EventoMotor, w: EstadoTrabajo): void {
  if (ev.bloqueId === undefined) return;
  if (ev.tipo === 'respuesta_correcta') w.respuestas[ev.bloqueId] = true;
  else if (ev.tipo === 'respuesta_incorrecta') w.respuestas[ev.bloqueId] = false;

  const nuevo = estadoDeEvento(ev.tipo);
  if (nuevo === undefined) return;
  const actual = leer(w.estados, ev.bloqueId) ?? 'normal';
  if (actual === 'deshabilitado') return;
  if (nuevo === 'visitado' && actual !== 'normal') return;
  w.estados[ev.bloqueId] = nuevo;
}

function aviso(c: Corrida, a: Aviso): void {
  c.avisos.push(a);
}

function ejecutarAccion(
  accion: Accion,
  reglaId: string,
  origen: EventoMotor,
  profundidad: number,
  c: Corrida,
  ctxEval: CtxEvaluacion,
): void {
  const { w } = c;
  switch (accion.tipo) {
    case 'ir_a_slide':
    case 'siguiente':
    case 'anterior': {
      if (c.navegacionEmitida) {
        aviso(c, {
          codigo: 'navegacion_ignorada',
          reglaId,
          mensaje:
            'Ya hay una navegación en este evento; se conserva la primera y se ignora esta.',
        });
        return;
      }
      c.navegacionEmitida = true;
      c.efectos.push({
        tipo: 'navegar',
        destino:
          accion.tipo === 'ir_a_slide'
            ? { tipo: 'slide', slideId: accion.slideId }
            : { tipo: accion.tipo },
      });
      return;
    }
    case 'mostrar':
      w.visibles[accion.bloqueId] = true;
      return;
    case 'ocultar':
      w.visibles[accion.bloqueId] = false;
      return;
    case 'cambiar_estado': {
      const anterior = leer(w.estados, accion.bloqueId) ?? 'normal';
      w.estados[accion.bloqueId] = accion.estado;
      const emitido = eventoDeEstado(accion.estado);
      // Solo se encadena un evento si el estado REALMENTE cambió: una
      // asignación sin efecto no puede alimentar un ciclo.
      if (emitido !== undefined && anterior !== accion.estado) {
        c.cola.push({
          evento: {
            tipo: emitido,
            bloqueId: accion.bloqueId,
            slideId: origen.slideId,
          },
          profundidad: profundidad + 1,
        });
      }
      return;
    }
    case 'abrir_capa':
      if (!w.capasAbiertas.includes(accion.capaId)) {
        w.capasAbiertas.push(accion.capaId);
      }
      return;
    case 'cerrar_capa':
      w.capasAbiertas = w.capasAbiertas.filter((id) => id !== accion.capaId);
      return;
    case 'asignar_variable': {
      const def = c.defs.get(accion.variableId);
      if (!def || leer(w.variables, accion.variableId) === undefined) {
        aviso(c, {
          codigo: 'variable_inexistente',
          reglaId,
          mensaje: `La variable «${accion.variableId}» no existe.`,
        });
        return;
      }
      const valor = evaluarOperando(accion.valor, w, ctxEval);
      if (valor === undefined) return; // ya se avisó (variable de origen inexistente)
      if (!coincideTipo(def, valor)) {
        aviso(c, {
          codigo: 'tipo_incompatible',
          reglaId,
          mensaje: `No se puede asignar ese valor a «${def.nombre}» (${def.tipo}).`,
        });
        return;
      }
      w.variables[accion.variableId] = valor;
      return;
    }
    case 'sumar_variable': {
      const def = c.defs.get(accion.variableId);
      const actual = leer(w.variables, accion.variableId);
      if (!def || actual === undefined) {
        aviso(c, {
          codigo: 'variable_inexistente',
          reglaId,
          mensaje: `La variable «${accion.variableId}» no existe.`,
        });
        return;
      }
      const suma =
        typeof actual === 'number' && typeof accion.cantidad === 'number'
          ? actual + accion.cantidad
          : NaN;
      if (def.tipo !== 'numero' || !Number.isFinite(suma)) {
        aviso(c, {
          codigo: 'tipo_incompatible',
          reglaId,
          mensaje: `Solo se puede sumar un número finito a una variable numérica («${def.nombre}»).`,
        });
        return;
      }
      w.variables[accion.variableId] = suma;
      return;
    }
    default:
      return;
  }
}

/**
 * Corazón del paquete. PURO: no toca DOM, red, reloj ni azar, y no muta sus
 * argumentos. Dado el mismo estado, reglas y evento devuelve siempre lo mismo.
 *
 * Orden determinista:
 *  1. se sincroniza el evento entrante (respuesta, visitado, seleccionado);
 *  2. las reglas que coinciden se evalúan en el orden del arreglo `reglas`, y
 *     CADA REGLA VE LOS CAMBIOS DE LAS ANTERIORES en el mismo evento (estado
 *     vivo, como los triggers de Storyline). Ej.: si la regla 1 sube `intentos`
 *     de 2 a 3, la regla 2 (`intentos >= 3`) ya dispara en ese mismo evento;
 *  3. los eventos que las acciones generan (`cambiar_estado` a visitado /
 *     seleccionado) se procesan DESPUÉS, en orden FIFO.
 *
 * Protecciones (D5, entrada no confiable):
 *  - `profundidadEventos`: tope de encadenamiento.
 *  - ciclos: una regla no corre dos veces para el mismo evento dentro de una
 *    misma corrida (clave regla+evento+bloque+slide) → `ciclo_cortado`.
 *  - `maxAcciones`: tope de acciones por evento de entrada → `limite_acciones`.
 *  - nunca lanza: una referencia rota o un tipo incompatible deja un `Aviso`.
 *
 * Solo hay un efecto posible: `navegar` (y solo el primero por evento). El
 * motor no califica ni escribe puntajes (C1/C4).
 */
export function procesarEvento(
  reglas: readonly ReglaAplicable[],
  estado: EstadoMotor,
  evento: EventoMotor,
  contexto: ContextoMotor,
  limites: Partial<LimitesMotor> = {},
): ResultadoMotor {
  const lim: LimitesMotor = { ...LIMITES_POR_DEFECTO, ...limites };
  const c: Corrida = {
    w: clonarEstado(estado),
    defs: new Map(contexto.variables.map((v) => [v.id, v])),
    efectos: [],
    avisos: [],
    cola: [{ evento, profundidad: 0 }],
    accionesRestantes: lim.maxAcciones,
    navegacionEmitida: false,
    abortada: false,
  };

  sincronizarEntrada(evento, c.w);

  const ejecutadas = new Set<string>();

  while (c.cola.length > 0 && !c.abortada) {
    const { evento: ev, profundidad } = c.cola.shift() as {
      evento: EventoMotor;
      profundidad: number;
    };

    if (profundidad > lim.profundidadEventos) {
      aviso(c, {
        codigo: 'profundidad_excedida',
        mensaje: `Encadenamiento de eventos mayor a ${lim.profundidadEventos}: se detiene.`,
      });
      continue;
    }

    for (const ra of reglas) {
      if (c.abortada) break;
      if (!ra.regla.activa || !coincideEvento(ra, ev)) continue;

      const clave = `${ra.regla.id}\u0000${ev.tipo}\u0000${ev.bloqueId ?? ''}\u0000${ev.slideId ?? ''}`;
      if (ejecutadas.has(clave)) {
        aviso(c, {
          codigo: 'ciclo_cortado',
          reglaId: ra.regla.id,
          mensaje: 'La regla se volvería a disparar por su propia cadena: se corta el ciclo.',
        });
        continue;
      }
      ejecutadas.add(clave);

      const ctxEval: CtxEvaluacion = {
        avisos: c.avisos,
        profundidadMax: lim.profundidadCondicion,
        reglaId: ra.regla.id,
      };
      if (!evaluarCondiciones(ra.regla.condiciones, c.w, ctxEval)) continue;

      for (const accion of ra.regla.acciones) {
        if (c.accionesRestantes <= 0) {
          aviso(c, {
            codigo: 'limite_acciones',
            reglaId: ra.regla.id,
            mensaje: `Se superó el máximo de ${lim.maxAcciones} acciones por evento: se detiene.`,
          });
          c.abortada = true;
          break;
        }
        c.accionesRestantes -= 1;
        ejecutarAccion(accion, ra.regla.id, ev, profundidad, c, ctxEval);
      }
    }
  }

  return { estado: c.w, efectos: c.efectos, avisos: c.avisos };
}

