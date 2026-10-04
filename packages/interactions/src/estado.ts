import type {
  EstadoDeBloque,
  VariableDef,
  VariableValor,
} from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import { recorrerBloquesDeSlide } from './recolectar.js';
import type { EstadoMotor } from './tipos.js';

/** Copia mutable interna; nunca sale del paquete. */
export interface EstadoTrabajo {
  variables: Record<string, VariableValor>;
  estados: Record<string, EstadoDeBloque>;
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

export function valorPorDefecto(def: VariableDef): VariableValor {
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

type SlideInicial = Pick<Slide, 'bloques' | 'capas'> & { id?: string };

/** Marca, dentro de `visibles`, que el slide ya se visitó en este intento. */
const MARCA_VISITA = '\u001f';

function marcaDeVisita(slideId: string): string {
  return `${MARCA_VISITA}${slideId}`;
}

/** N5: marca, dentro de `visibles`, que un temporizador ya disparó en este intento. */
export function marcaDeTemporizador(slideId: string, segundos: number): string {
  return `\u001e${slideId}\u001e${segundos}`;
}

/** `ocultoInicial` solo se escribe si esa clave todavía no existe. */
function sembrarVisibles(trabajo: EstadoTrabajo, slide: SlideInicial): void {
  recorrerBloquesDeSlide(slide, (bloque) => {
    if (bloque.ocultoInicial !== true) return;
    const id = idDeBloque(bloque);
    if (id === undefined || Object.hasOwn(trabajo.visibles, id)) return;
    trabajo.visibles[id] = false;
  });
}

/** Capas `visibleInicial`. Solo en la primera visita, para no reabrir las que el alumno cerró. */
function sembrarCapasIniciales(trabajo: EstadoTrabajo, slide: SlideInicial): void {
  for (const capa of slide.capas ?? []) {
    if (capa.visibleInicial && !trabajo.capasAbiertas.includes(capa.id)) {
      trabajo.capasAbiertas.push(capa.id);
    }
  }
}

/**
 * Estado con el que empieza un alumno: variables en su valor inicial, estado
 * de objeto de cada bloque (`Block.estado`), capas con `visibleInicial` y
 * bloques `ocultoInicial` (`visibles[id] = false`). Una clave que ya exista
 * en `visibles` no se pisa.
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
    sembrarVisibles(trabajo, slide);
    if (slide.id) trabajo.visibles[marcaDeVisita(slide.id)] = true;
  }

  return trabajo;
}

/**
 * Primera visita al slide en este intento: siembra lo que falte.
 * Si el slide ya se visitó (o K5 restauró `visibles`/`capasAbiertas`), no reabre
 * capas ni pisa un bloque que una acción ya mostró u ocultó.
 */
export function entrarASlide(estado: EstadoMotor, slide: SlideInicial & { id: string }): EstadoMotor {
  const trabajo = clonarEstado(estado);
  const primera = !Object.hasOwn(trabajo.visibles, marcaDeVisita(slide.id));
  sembrarVisibles(trabajo, slide);
  if (primera) sembrarCapasIniciales(trabajo, slide);
  trabajo.visibles[marcaDeVisita(slide.id)] = true;
  return congelar(trabajo);
}

export function congelar(trabajo: EstadoTrabajo): EstadoMotor {
  return trabajo;
}
