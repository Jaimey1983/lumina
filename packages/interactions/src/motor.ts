import type {
  Accion,
  EstadoDeBloque,
  EstadoObjeto,
  EventoTipo,
  VariableDef,
  VariableValor,
} from '@lumina/types/interaction';
import { evaluarCondiciones, evaluarOperando } from './condiciones.js';
import type { CtxEvaluacion } from './condiciones.js';
import { clonarEstado, coincideTipo, leer, marcaDeTemporizador, valorPorDefecto } from './estado.js';
import type { EstadoTrabajo } from './estado.js';
import { estadoDeclarado } from './estados-bloque.js';
import { EVENTOS_DE_SLIDE, esSegundosValidos, esTeclaPermitida } from './eventos.js';
import { LIMITES_POR_DEFECTO } from './tipos.js';
import { MAX_TEXTO_VARIABLE } from './variables.js';
import { describirEvento } from './describir.js';
import { DESCRIPCION_POR_IDS, explicarFalla } from './traza.js';
import type {
  Aviso,
  ContextoMotor,
  Efecto,
  EstadoMotor,
  EventoMotor,
  LimitesMotor,
  OpcionesMotor,
  PasoTraza,
  ReglaAplicable,
  ResultadoMotor,
} from './tipos.js';

/** ¿El parámetro de la regla coincide con el detalle del evento? (D16) */
function coincideParametro(ra: ReglaAplicable, ev: EventoMotor): boolean {
  const p = ra.regla.parametro;
  switch (ra.regla.evento) {
    case 'cambio_variable':
      return typeof p === 'string' && p !== '' && ev.detalle?.variableId === p;
    case 'tecla':
      return esTeclaPermitida(p) && ev.detalle?.tecla === p;
    case 'temporizador':
      return esSegundosValidos(p) && ev.detalle?.segundos === p;
    default:
      return true;
  }
}

function coincideEvento(ra: ReglaAplicable, ev: EventoMotor): boolean {
  if (ra.regla.evento !== ev.tipo) return false;
  if (!coincideParametro(ra, ev)) return false;
  // `cambio_variable`: las variables son de la clase, así que reaccionan reglas
  // de cualquier slide o bloque.
  if (ev.tipo === 'cambio_variable') return true;
  // Eventos «de slide» (tecla, temporizador, salir_slide): una regla de bloque
  // o de slide reacciona cuando ocurren en SU slide.
  if (EVENTOS_DE_SLIDE.has(ev.tipo)) {
    return ev.slideId !== undefined && ev.slideId === ra.origen.slideId;
  }
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
function eventoDeEstado(estado: EstadoDeBloque): EventoTipo | undefined {
  if (estado === 'visitado') return 'visitado';
  if (estado === 'seleccionado') return 'seleccionado';
  return undefined;
}

interface Corrida {
  w: EstadoTrabajo;
  defs: Map<string, VariableDef>;
  personalizados: Readonly<Record<string, readonly string[]>> | undefined;
  efectos: Efecto[];
  avisos: Aviso[];
  cola: { evento: EventoMotor; profundidad: number }[];
  accionesRestantes: number;
  navegacionEmitida: boolean;
  /** Se detuvo todo el procesamiento (límite de acciones). */
  abortada: boolean;
  /** N8 — solo existe con la traza encendida. */
  traza?: PasoTraza[];
}

/** N8 — por qué una regla del mismo tipo de evento no reaccionó. */
function motivoNoCoincide(ra: ReglaAplicable, ev: EventoMotor): string {
  if (!coincideParametro(ra, ev)) return 'El evento es del mismo tipo, pero con otro parámetro (variable, tecla o segundos).';
  if (EVENTOS_DE_SLIDE.has(ev.tipo) || ra.origen.tipo === 'slide') {
    return 'El evento ocurrió en otro slide.';
  }
  return 'El evento lo emitió otro elemento.';
}

/**
 * Aplica el evento ENTRANTE al estado de trabajo, antes de evaluar reglas:
 *  - `respuesta_correcta` / `respuesta_incorrecta` registran el resultado.
 *  - `visitado` / `seleccionado` actualizan el estado del bloque (un bloque
 *    `deshabilitado` no cambia; `visitado` no degrada a un `seleccionado`).
 */
function sincronizarEntrada(ev: EventoMotor, w: EstadoTrabajo): void {
  // N5: un temporizador dispara UNA vez por intento; se deja la marca en
  // `visibles` (como la de visita de K8a) para que sobreviva a una recarga.
  if (ev.tipo === 'temporizador' && ev.slideId !== undefined) {
    const seg = ev.detalle?.segundos;
    if (typeof seg === 'number') w.visibles[marcaDeTemporizador(ev.slideId, seg)] = true;
    return;
  }
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

/**
 * Escribe una variable y, SOLO si el valor realmente cambió, encadena el evento
 * `cambio_variable` (N5). Una asignación sin efecto no puede alimentar un ciclo;
 * el corte de ciclos y los topes del motor cubren el resto.
 */
function fijarVariable(
  c: Corrida,
  variableId: string,
  valor: VariableValor,
  origen: EventoMotor,
  profundidad: number,
): void {
  const anterior = leer(c.w.variables, variableId);
  c.w.variables[variableId] = valor;
  if (anterior === valor) return;
  c.cola.push({
    evento: {
      tipo: 'cambio_variable',
      ...(origen.slideId !== undefined ? { slideId: origen.slideId } : {}),
      detalle: { variableId },
    },
    profundidad: profundidad + 1,
  });
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
      if (origen.tipo === 'salir_slide') {
        // Navegar mientras se sale de un slide encadenaría saltos: se ignora.
        aviso(c, {
          codigo: 'navegacion_ignorada',
          reglaId,
          mensaje: 'No se puede navegar desde «al salir del slide»; se ignora.',
        });
        return;
      }
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
      if (!estadoDeclarado(accion.estado, accion.bloqueId, c.personalizados)) {
        aviso(c, {
          codigo: 'estado_inexistente',
          reglaId,
          mensaje: `El elemento no declara el estado «${String(accion.estado)}»: no se aplica.`,
        });
        return;
      }
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
      fijarVariable(c, accion.variableId, valor, origen, profundidad);
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
      fijarVariable(c, accion.variableId, suma, origen, profundidad);
      return;
    }
    case 'restar_variable':
    case 'multiplicar_variable':
    case 'dividir_variable': {
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
      const cantidad = evaluarOperando(accion.cantidad, w, ctxEval);
      if (cantidad === undefined) return; // ya se avisó (origen inexistente o sin dato)
      if (
        def.tipo !== 'numero' ||
        typeof actual !== 'number' ||
        typeof cantidad !== 'number' ||
        !Number.isFinite(cantidad)
      ) {
        aviso(c, {
          codigo: 'tipo_incompatible',
          reglaId,
          mensaje: `Solo se puede operar con números sobre una variable numérica («${def.nombre}»).`,
        });
        return;
      }
      if (accion.tipo === 'dividir_variable' && cantidad === 0) {
        aviso(c, {
          codigo: 'resultado_invalido',
          reglaId,
          mensaje: `No se puede dividir «${def.nombre}» por cero: no se cambia.`,
        });
        return;
      }
      const resultado =
        accion.tipo === 'restar_variable'
          ? actual - cantidad
          : accion.tipo === 'multiplicar_variable'
            ? actual * cantidad
            : actual / cantidad;
      if (!Number.isFinite(resultado)) {
        aviso(c, {
          codigo: 'resultado_invalido',
          reglaId,
          mensaje: `El resultado para «${def.nombre}» no es un número finito: no se cambia.`,
        });
        return;
      }
      fijarVariable(c, accion.variableId, resultado, origen, profundidad);
      return;
    }
    case 'limpiar_variable': {
      const def = c.defs.get(accion.variableId);
      if (!def || leer(w.variables, accion.variableId) === undefined) {
        aviso(c, {
          codigo: 'variable_inexistente',
          reglaId,
          mensaje: `La variable «${accion.variableId}» no existe.`,
        });
        return;
      }
      fijarVariable(c, accion.variableId, coincideTipo(def, def.valorInicial)
        ? def.valorInicial
        : valorPorDefecto(def), origen, profundidad);
      return;
    }
    case 'concatenar_variable': {
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
      const extra = evaluarOperando(accion.texto, w, ctxEval);
      if (extra === undefined) return;
      if (def.tipo !== 'texto' || typeof actual !== 'string') {
        aviso(c, {
          codigo: 'tipo_incompatible',
          reglaId,
          mensaje: `Solo se puede concatenar sobre una variable de texto («${def.nombre}»).`,
        });
        return;
      }
      const piezas = typeof extra === 'boolean' ? (extra ? 'Sí' : 'No') : String(extra);
      let nuevo = actual + piezas;
      if (nuevo.length > MAX_TEXTO_VARIABLE) {
        nuevo = nuevo.slice(0, MAX_TEXTO_VARIABLE);
        aviso(c, {
          codigo: 'texto_recortado',
          reglaId,
          mensaje: `«${def.nombre}» superó ${MAX_TEXTO_VARIABLE} caracteres: se recortó.`,
        });
      }
      fijarVariable(c, accion.variableId, nuevo, origen, profundidad);
      return;
    }
    case 'alternar_variable': {
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
      if (def.tipo !== 'booleano' || typeof actual !== 'boolean') {
        aviso(c, {
          codigo: 'tipo_incompatible',
          reglaId,
          mensaje: `Solo se puede alternar una variable verdadero/falso («${def.nombre}»).`,
        });
        return;
      }
      fijarVariable(c, accion.variableId, !actual, origen, profundidad);
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
  opciones: OpcionesMotor = {},
): ResultadoMotor {
  const lim: LimitesMotor = { ...LIMITES_POR_DEFECTO, ...limites };
  const c: Corrida = {
    w: clonarEstado(estado),
    defs: new Map(contexto.variables.map((v) => [v.id, v])),
    personalizados: contexto.estadosPersonalizados,
    efectos: [],
    avisos: [],
    cola: [{ evento, profundidad: 0 }],
    accionesRestantes: lim.maxAcciones,
    navegacionEmitida: false,
    abortada: false,
    ...(opciones.traza === true ? { traza: [] } : {}),
  };
  const nombres = opciones.descripcion ?? DESCRIPCION_POR_IDS;

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
      // N8: solo es «candidata» una regla del mismo tipo de evento. La traza no
      // cambia ninguna decisión: estas ramas hacen exactamente lo de siempre.
      const candidata = c.traza !== undefined && ra.regla.evento === ev.tipo;
      const paso = (
        p: Pick<PasoTraza, 'evaluada' | 'resultado' | 'motivo' | 'acciones'>,
      ): void => {
        c.traza?.push({ reglaId: ra.regla.id, evento: ev, profundidad, ...p });
      };
      if (!ra.regla.activa) {
        if (candidata) {
          paso({ evaluada: false, resultado: 'inactiva', motivo: 'La regla está desactivada.', acciones: 0 });
        }
        continue;
      }
      if (!coincideEvento(ra, ev)) {
        if (candidata) {
          paso({ evaluada: false, resultado: 'no_coincide', motivo: motivoNoCoincide(ra, ev), acciones: 0 });
        }
        continue;
      }

      const clave = `${ra.regla.id}\u0000${ev.tipo}\u0000${ev.bloqueId ?? ''}\u0000${ev.slideId ?? ''}`;
      if (ejecutadas.has(clave)) {
        aviso(c, {
          codigo: 'ciclo_cortado',
          reglaId: ra.regla.id,
          mensaje: 'La regla se volvería a disparar por su propia cadena: se corta el ciclo.',
        });
        if (c.traza) {
          paso({
            evaluada: false,
            resultado: 'ciclo_cortado',
            motivo: 'Ya corrió para este mismo evento dentro de la cadena: se corta para evitar un ciclo.',
            acciones: 0,
          });
        }
        continue;
      }
      ejecutadas.add(clave);

      const ctxEval: CtxEvaluacion = {
        avisos: c.avisos,
        profundidadMax: lim.profundidadCondicion,
        reglaId: ra.regla.id,
        ...(contexto.sistema !== undefined ? { sistema: contexto.sistema } : {}),
      };
      const cumple = evaluarCondiciones(ra.regla.condiciones, c.w, ctxEval);
      // «Si no» (N1/D15): solo cuando la condición dio FALSO de verdad. Una
      // condición rota (`ctxEval.rota`) no ejecuta ninguna rama: falla cerrado.
      const lista = cumple
        ? ra.regla.acciones
        : ctxEval.rota === true
          ? []
          : (ra.regla.sino ?? []);

      if (c.traza) {
        const rota = ctxEval.rota === true;
        const falla = cumple || rota
          ? null
          : explicarFalla(ra.regla.condiciones, c.w, ctxEval, nombres);
        paso(
          cumple
            ? {
                evaluada: true,
                resultado: 'disparada',
                motivo:
                  ra.regla.condiciones.length === 0
                    ? `Se disparó: ${describirEvento(ra.regla, nombres)} y no tiene condiciones.`
                    : 'Se disparó: se cumplen las condiciones.',
                acciones: lista.length,
              }
            : rota
              ? {
                  evaluada: true,
                  resultado: 'condicion_rota',
                  motivo:
                    'No se disparó: la condición no se pudo evaluar (' +
                    (c.avisos
                      .filter((a) => a.reglaId === ra.regla.id)
                      .map((a) => a.mensaje)
                      .at(-1) ?? 'referencia inexistente') +
                    ').',
                  acciones: 0,
                }
              : {
                  evaluada: true,
                  resultado: lista.length > 0 ? 'sino' : 'no_cumple',
                  motivo: `${lista.length > 0 ? 'Corrió «si no»' : 'No se disparó'}: ${falla ?? 'no se cumple la condición'}.`,
                  acciones: lista.length,
                },
        );
      }

      for (const accion of lista) {
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

  return {
    estado: c.w,
    efectos: c.efectos,
    avisos: c.avisos,
    ...(c.traza !== undefined ? { traza: c.traza } : {}),
  };
}

