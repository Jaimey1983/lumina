/**
 * U8 — galería de estilos de una actividad: presets (`ElementPreset`) que cambian el aspecto
 * (`ajustes.estilo`) y, en el mismo gesto, lo que va con él (sonido, intentos, orden…).
 * Solo escriben `ajustes` (y, si el tipo lo pide, datos propios como el color del dorso),
 * y solo los ajustes que el tipo soporta (`CapacidadesAjustes`).
 */
import type { DeepPartial, ElementPreset } from '@lumina/element-kit-core';
import type { ActivityEstilo, ActivitySettings } from '@lumina/types/slide';

import type { CapacidadesAjustes } from './activity-ajustes-capacidades.js';

interface DefinicionEstilo {
  readonly label: string;
  readonly description: string;
  /** Ajustes del estilo; `crearPresetsDeEstilo` descarta los que el tipo no soporta. */
  readonly ajustes: (c: CapacidadesAjustes) => ActivitySettings;
}

const ESTILOS: Readonly<Record<ActivityEstilo, DefinicionEstilo>> = {
  escolar: {
    label: 'Escolar',
    description: 'El aspecto de siempre, con sonido y mensajes al responder.',
    ajustes: (c) => ({
      estilo: 'escolar',
      sonido: true,
      ...(c.mostrarNota ? { mostrarNota: true } : {}),
      ...(c.retroalimentacion?.includes('inmediata') ? { retroalimentacion: 'inmediata' as const } : {}),
    }),
  },
  examen: {
    label: 'Examen',
    description: 'Sobrio y en silencio: un intento, sin mensajes ni explicación.',
    ajustes: (c) => ({
      estilo: 'examen',
      sonido: false,
      ...(c.mostrarNota ? { mostrarNota: true } : {}),
      ...(c.intentos ? { intentos: 1 } : {}),
      ...(c.barajar ? { barajar: true } : {}),
      ...(c.retroalimentacion?.includes('ninguna') ? { retroalimentacion: 'ninguna' as const } : {}),
      ...(c.mostrarSolucion ? { mostrarSolucion: false } : {}),
    }),
  },
  arcade: {
    label: 'Arcade',
    description: 'Fondo oscuro, colores vivos y sonido.',
    ajustes: (c) => ({
      estilo: 'arcade',
      sonido: true,
      ...(c.intentos ? { intentos: null } : {}),
    }),
  },
  minimal: {
    label: 'Minimal',
    description: 'Plano y limpio, sin sonido.',
    ajustes: () => ({ estilo: 'minimal', sonido: false }),
  },
  pizarra: {
    label: 'Pizarra',
    description: 'Verde de pizarrón con letras de tiza.',
    ajustes: () => ({ estilo: 'pizarra', sonido: true }),
  },
};

export const ORDEN_ESTILOS: readonly ActivityEstilo[] = ['escolar', 'examen', 'arcade', 'minimal', 'pizarra'];

/**
 * Presets de estilo de un tipo. `extra` suma datos propios por estilo (p. ej. el color del
 * dorso de Memoria), siempre como parche profundo del estado.
 */
export function crearPresetsDeEstilo<TEstado extends { ajustes?: ActivitySettings }>(
  capacidades: CapacidadesAjustes,
  extra: Partial<Record<ActivityEstilo, DeepPartial<TEstado>>> = {},
): readonly ElementPreset<TEstado>[] {
  return ORDEN_ESTILOS.map((id) => ({
    id,
    label: ESTILOS[id].label,
    description: ESTILOS[id].description,
    estadoPatch: {
      ...(extra[id] as object | undefined),
      ajustes: ESTILOS[id].ajustes(capacidades),
    } as DeepPartial<TEstado>,
  }));
}
