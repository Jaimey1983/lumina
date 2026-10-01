// Utilidades compartidas SOLO por los specs (excluido del build en tsconfig.build.json).
import type {
  Accion,
  Condicion,
  EventoTipo,
  Regla,
  VariableDef,
} from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import type { OrigenRegla, ReglaAplicable } from './tipos.js';

export const num = (id: string, valorInicial = 0): VariableDef => ({
  id,
  nombre: id,
  tipo: 'numero',
  valorInicial,
});
export const bool = (id: string, valorInicial = false): VariableDef => ({
  id,
  nombre: id,
  tipo: 'booleano',
  valorInicial,
});
export const txt = (id: string, valorInicial = ''): VariableDef => ({
  id,
  nombre: id,
  tipo: 'texto',
  valorInicial,
});

export const lit = (valor: number | string | boolean) =>
  ({ tipo: 'literal', valor }) as const;
export const variable = (variableId: string) =>
  ({ tipo: 'variable', variableId }) as const;

type Comparacion = Extract<Condicion, { tipo: 'comparacion' }>;

export function cmp(
  izquierda: Comparacion['izquierda'],
  operador: Comparacion['operador'],
  derecha: Comparacion['derecha'],
): Condicion {
  return { tipo: 'comparacion', operador, izquierda, derecha };
}

export function regla(
  id: string,
  evento: EventoTipo,
  acciones: Accion[],
  condiciones: Condicion[] = [],
  activa = true,
): Regla {
  return { id, evento, condiciones, acciones, activa };
}

export const deBloque = (
  r: Regla,
  bloqueId: string,
  slideId = 's1',
): ReglaAplicable => ({
  regla: r,
  origen: { tipo: 'bloque', bloqueId, slideId } as OrigenRegla,
});
export const deSlide = (r: Regla, slideId = 's1'): ReglaAplicable => ({
  regla: r,
  origen: { tipo: 'slide', slideId },
});

/** Bloque mínimo (los specs no necesitan un `TextBlock` completo). */
export const bloque = (id: string | undefined, extra: object = {}): Block =>
  ({ tipo: 'texto', contenido: 'x', ...(id ? { id } : {}), ...extra }) as unknown as Block;

export const slide = (
  id: string,
  extra: Partial<Pick<Slide, 'bloques' | 'capas' | 'reglas'>> = {},
): Pick<Slide, 'id' | 'bloques' | 'capas' | 'reglas'> => ({ id, ...extra });
