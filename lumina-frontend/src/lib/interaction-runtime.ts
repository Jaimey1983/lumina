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
  const base = estado ?? crearEstadoInicial(variables, slides);
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
