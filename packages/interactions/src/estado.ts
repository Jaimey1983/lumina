import type {
  EstadoObjeto,
  VariableDef,
  VariableValor,
} from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import type { EstadoMotor } from './tipos.js';

/** Copia mutable interna; nunca sale del paquete. */
export interface EstadoTrabajo {
  variables: Record<string, VariableValor>;
  estados: Record<string, EstadoObjeto>;
  visibles: Record<string, boolean>;
  capasAbiertas: string[];
  respuestas: Record<string, boolean>;
}

/**
 * Los ids vienen de JSON editable: un id como `__proto__` o `constructor` no
 * debe ser capaz de tocar el prototipo ni de "existir" por herencia. Por eso
 * los registros internos no tienen prototipo y las lecturas usan `hasOwn`.
 */
function registroVacio<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function copiarRegistro<T>(origen: Readonly<Record<string, T>>): Record<string, T> {
  const destino = registroVacio<T>();
  for (const clave of Object.keys(origen)) destino[clave] = origen[clave] as T;
  return destino;
}

export function leer<T>(
  registro: Readonly<Record<string, T>>,
  clave: string,
): T | undefined {
  return Object.hasOwn(registro, clave) ? registro[clave] : undefined;
}

export function coincideTipo(def: VariableDef, valor: unknown): boolean {
  switch (def.tipo) {
    case 'numero':
      return typeof valor === 'number' && Number.isFinite(valor);
    case 'texto':
      return typeof valor === 'string';
    case 'booleano':
      return typeof valor === 'boolean';
    default:
      return false;
  }
}

function valorPorDefecto(def: VariableDef): VariableValor {
  switch (def.tipo) {
    case 'numero':
      return 0;
    case 'texto':
      return '';
    default:
      return false;
  }
}

export function clonarEstado(estado: EstadoMotor): EstadoTrabajo {
  return {
    variables: copiarRegistro(estado.variables),
    estados: copiarRegistro(estado.estados),
    visibles: copiarRegistro(estado.visibles),
    capasAbiertas: [...estado.capasAbiertas],
    respuestas: copiarRegistro(estado.respuestas),
  };
}

type SlideInicial = Pick<Slide, 'bloques' | 'capas'>;

/**
 * Estado con el que empieza un alumno: variables en su valor inicial, estado
 * de objeto de cada bloque (`Block.estado`) y capas con `visibleInicial`.
 *
 * Un `valorInicial` incoherente con su `tipo` se reemplaza por el valor neutro
 * del tipo (el error lo reporta `validarReglas`, que es quien debe correr al
 * guardar; aquí nunca se lanza).
 */
export function crearEstadoInicial(
  variables: readonly VariableDef[],
  slides: readonly SlideInicial[] = [],
): EstadoMotor {
  const trabajo: EstadoTrabajo = {
    variables: registroVacio(),
    estados: registroVacio(),
    visibles: registroVacio(),
    capasAbiertas: [],
    respuestas: registroVacio(),
  };

  for (const def of variables) {
    trabajo.variables[def.id] = coincideTipo(def, def.valorInicial)
      ? def.valorInicial
      : valorPorDefecto(def);
  }

  for (const slide of slides) {
    for (const bloque of slide.bloques ?? []) {
      const id = idDeBloque(bloque);
      if (id !== undefined && bloque.estado && bloque.estado !== 'normal') {
        trabajo.estados[id] = bloque.estado;
      }
    }
    for (const capa of slide.capas ?? []) {
      if (capa.visibleInicial && !trabajo.capasAbiertas.includes(capa.id)) {
        trabajo.capasAbiertas.push(capa.id);
      }
      for (const bloque of capa.bloques) {
        const id = idDeBloque(bloque);
        if (id !== undefined && bloque.estado && bloque.estado !== 'normal') {
          trabajo.estados[id] = bloque.estado;
        }
      }
    }
  }

  return trabajo;
}

export function congelar(trabajo: EstadoTrabajo): EstadoMotor {
  return trabajo;
}
