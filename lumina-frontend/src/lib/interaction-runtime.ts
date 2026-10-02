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
  crearEstadoInicial,
  entrarASlide,
  procesarEvento,
  type EstadoMotor,
  type EventoMotor,
  type ReglaAplicable,
} from '@lumina/interactions';
import type { VariableDef } from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import type { SlideNavAction } from '@lumina/editor-shared/slide-nav-context';

export interface EjecutarEventoArgs {
  reglas: readonly ReglaAplicable[];
  /** `null` = todavía no hubo eventos: se parte del estado inicial de los slides. */
  estado: EstadoMotor | null;
  variables: readonly VariableDef[];
  slides: readonly Slide[];
  evento: EventoMotor;
  /** Función de `SlideNavContext`; `null` = inerte para navegación (D1). */
  navigate: ((action: SlideNavAction) => void) | null;
}

/** Procesa un evento, ejecuta los efectos de navegación y devuelve el estado nuevo. */
export function ejecutarEvento({
  reglas,
  estado,
  variables,
  slides,
  evento,
  navigate,
}: EjecutarEventoArgs): EstadoMotor {
  let base = estado ?? crearEstadoInicial(variables, slides);
  if (evento.tipo === 'al_entrar_slide' && evento.slideId) {
    const slide = slides.find((s) => s.id === evento.slideId);
    if (slide) base = entrarASlide(base, slide);
  }
  if (reglas.length === 0) return base;
  const res = procesarEvento(reglas, base, evento, { variables });
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
  return res.estado;
}

const ESTADOS_OBJETO = new Set(['normal', 'visitado', 'seleccionado', 'deshabilitado']);

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

  const estados = { ...base.estados };
  if (esRegistro(guardado.estados)) {
    for (const [id, valor] of Object.entries(guardado.estados)) {
      if (typeof valor === 'string' && ESTADOS_OBJETO.has(valor)) {
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
