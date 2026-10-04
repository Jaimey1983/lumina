/**
 * Núcleo puro del runtime del motor de interacción (Etapa K / K4).
 * Sin React ni red: lo usa `useInteractionRuntime` y lo prueban los specs.
 *
 * C1/C4: no importa `@lumina/scoring` ni la capa de API. Procesar un evento
 * solo produce un `EstadoMotor` nuevo y llamadas a `navigate`; nunca crea ni
 * modifica resultados, así que reintentar o saltarse un slide no toca notas
 * (C2/C3: eso lo siguen decidiendo `onResponse` y el backend).
 */

import {
  calcularSistema,
  conTiempoActivo,
  crearEstadoInicial,
  entrarASlide,
  estadoDeclarado,
  estadosPersonalizadosPorBloque,
  procesarEvento,
  type Aviso,
  type ContextoDescripcion,
  type Efecto,
  type EstadoMotor,
  type EventoMotor,
  type PasoTraza,
  type ReglaAplicable,
} from '@lumina/interactions';
import type { VariableDef, VariableValor } from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import type { SlideNavAction } from '@lumina/editor-shared/slide-nav-context';

/** N6 — los estados declarados por bloque dependen solo de `slides`: se calculan una vez por mazo. */
const declaradosPorSlides = new WeakMap<
  readonly Slide[],
  Readonly<Record<string, readonly string[]>>
>();
function declaradosDe(slides: readonly Slide[]): Readonly<Record<string, readonly string[]>> {
  let d = declaradosPorSlides.get(slides);
  if (d === undefined) {
    d = estadosPersonalizadosPorBloque(slides);
    declaradosPorSlides.set(slides, d);
  }
  return d;
}

/** N8 — un evento procesado y lo que el motor decidió con cada regla candidata. */
export interface RegistroEvento {
  /** Correlativo dentro de la prueba (para listas con `key`). */
  id: number;
  evento: EventoMotor;
  pasos: PasoTraza[];
  avisos: Aviso[];
  efectos: Efecto[];
  /** Variables DESPUÉS del evento. */
  variables: Readonly<Record<string, VariableValor>>;
}

/**
 * N8 — depuración de la VISTA PREVIA. Con esto el motor corre con la traza
 * encendida; el resultado (estado, efectos) es idéntico al de sin traza.
 */
export interface DepuracionEvento {
  descripcion: ContextoDescripcion;
  alProcesar: (registro: Omit<RegistroEvento, 'id'>) => void;
}

export interface EjecutarEventoArgs {
  reglas: readonly ReglaAplicable[];
  /** `null` = todavía no hubo eventos: se parte del estado inicial de los slides. */
  estado: EstadoMotor | null;
  variables: readonly VariableDef[];
  slides: readonly Slide[];
  evento: EventoMotor;
  /** Función de `SlideNavContext`; `null` = inerte para navegación (D1). */
  navigate: ((action: SlideNavAction) => void) | null;
  /**
   * N7 — datos del entorno para las variables del sistema (D18). Sin él, una
   * condición que lea una variable del sistema falla cerrado (no dispara).
   */
  entorno?: EntornoSistema;
  /** N8 — solo la vista previa lo pasa; el reproductor del alumno nunca. */
  depuracion?: DepuracionEvento;
}

/** N7 — lo que solo el reproductor sabe: tiempo activo del intento y número de intento. */
export interface EntornoSistema {
  /** Segundos activos del intento (sin contar la pestaña oculta). */
  tiempoActivoS: number;
  /** Número de intento (1-based). */
  intento: number;
}

/** Procesa un evento, ejecuta los efectos de navegación y devuelve el estado nuevo. */
export function ejecutarEvento({
  reglas,
  estado,
  variables,
  slides,
  evento,
  navigate,
  entorno,
  depuracion,
}: EjecutarEventoArgs): EstadoMotor {
  let base = estado ?? crearEstadoInicial(variables, slides);
  if (evento.tipo === 'al_entrar_slide' && evento.slideId) {
    const slide = slides.find((s) => s.id === evento.slideId);
    if (slide) base = entrarASlide(base, slide);
  }
  if (reglas.length === 0) return base;
  // N7: se calcula DESPUÉS de `entrarASlide`, para que el slide actual ya cuente como visitado.
  const sistema =
    entorno === undefined
      ? undefined
      : calcularSistema({
          estado: base,
          slideIds: slides.map((s) => s.id),
          slideId: evento.slideId,
          tiempoActivoS: entorno.tiempoActivoS,
          intento: entorno.intento,
        });
  const res = procesarEvento(
    reglas,
    base,
    evento,
    {
      variables,
      estadosPersonalizados: declaradosDe(slides),
      ...(sistema !== undefined ? { sistema } : {}),
    },
    {},
    depuracion ? { traza: true, descripcion: depuracion.descripcion } : {},
  );
  depuracion?.alProcesar({
    evento,
    pasos: res.traza ?? [],
    avisos: res.avisos,
    efectos: res.efectos,
    variables: res.estado.variables,
  });
  if (navigate) {
    for (const efecto of res.efectos) {
      if (efecto.tipo !== 'navegar') continue;
      const d = efecto.destino;
      if (d.tipo === 'siguiente') navigate({ kind: 'siguiente' });
      else if (d.tipo === 'anterior') navigate({ kind: 'anterior' });
      else {
        const index = slides.findIndex((s) => s.id === d.slideId);
        if (index >= 0) navigate({ kind: 'ir_a', index });
      }
    }
  }
  // N7: el tiempo activo viaja en el estado persistido (K5) para sobrevivir a una recarga.
  return entorno === undefined ? res.estado : conTiempoActivo(res.estado, entorno.tiempoActivoS);
}

function esRegistro(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * K5 — reconstruye un `EstadoMotor` a partir de lo que devolvió el backend.
 * Parte siempre del estado inicial de la clase y solo pisa lo que sea
 * coherente (variables declaradas con su tipo, estados válidos…): un estado
 * viejo, corrupto o de una clase editada no puede romper el reproductor.
 * Devuelve `null` si no hay nada que restaurar.
 */
export function hidratarEstado(
  guardado: unknown,
  variables: readonly VariableDef[],
  slides: readonly Slide[],
): EstadoMotor | null {
  if (!esRegistro(guardado)) return null;
  const base = crearEstadoInicial(variables, slides);
  const defs = new Map(variables.map((v) => [v.id, v]));

  const vars = { ...base.variables };
  if (esRegistro(guardado.variables)) {
    for (const [id, valor] of Object.entries(guardado.variables)) {
      const def = defs.get(id);
      if (!def) continue;
      const ok =
        (def.tipo === 'numero' && typeof valor === 'number' && Number.isFinite(valor)) ||
        (def.tipo === 'texto' && typeof valor === 'string') ||
        (def.tipo === 'booleano' && typeof valor === 'boolean');
      if (ok) vars[id] = valor as number | string | boolean;
    }
  }

  const declarados = declaradosDe(slides);
  const estados = { ...base.estados };
  if (esRegistro(guardado.estados)) {
    for (const [id, valor] of Object.entries(guardado.estados)) {
      // N6: un estado base, o un personalizado que ese bloque SIGA declarando.
      if (typeof valor === 'string' && estadoDeclarado(valor, id, declarados)) {
        estados[id] = valor as EstadoMotor['estados'][string];
      }
    }
  }

  const booleanos = (origen: unknown, inicial: Readonly<Record<string, boolean>>) => {
    const out = { ...inicial };
    if (esRegistro(origen)) {
      for (const [id, valor] of Object.entries(origen)) {
        if (typeof valor === 'boolean') out[id] = valor;
      }
    }
    return out;
  };

  const capas = Array.isArray(guardado.capasAbiertas)
    ? guardado.capasAbiertas.filter((c): c is string => typeof c === 'string')
    : [...base.capasAbiertas];

  return {
    variables: vars,
    estados,
    visibles: booleanos(guardado.visibles, base.visibles),
    capasAbiertas: capas,
    respuestas: booleanos(guardado.respuestas, base.respuestas),
  };
}
