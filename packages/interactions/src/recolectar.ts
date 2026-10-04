import type { VariableDef } from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import { estadosPersonalizadosPorBloque } from './estados-bloque.js';
import type { ReglaAplicable } from './tipos.js';

type SlideConReglas = Pick<Slide, 'id' | 'bloques' | 'capas' | 'reglas'>;

function visitarArbol(bloque: Block, visitar: (b: Block) => void): void {
  visitar(bloque);
  if (bloque.tipo === 'columnas') {
    for (const columna of bloque.columnas) {
      for (const hijo of columna) visitarArbol(hijo, visitar);
    }
  }
}

/**
 * Bloques del slide y de sus capas, incluyendo los hijos de «columnas».
 * No entra en `clip-group`: su contenido no es un `Block[]`.
 */
export function recorrerBloquesDeSlide(
  slide: Pick<Slide, 'bloques' | 'capas'>,
  visitar: (bloque: Block) => void,
): void {
  for (const bloque of slide.bloques ?? []) visitarArbol(bloque, visitar);
  for (const capa of slide.capas ?? []) {
    for (const bloque of capa.bloques) visitarArbol(bloque, visitar);
  }
}

/**
 * Aplana las reglas de todos los slides en el orden en que se evalúan:
 * por cada slide (en su orden) primero `Slide.reglas`, luego los
 * `disparadores` de sus bloques y por último los de los bloques de sus capas.
 * Ese orden fijo es lo que hace determinista al motor.
 */
export function recolectarReglas(
  slides: readonly SlideConReglas[],
): ReglaAplicable[] {
  const salida: ReglaAplicable[] = [];
  for (const slide of slides) {
    for (const regla of slide.reglas ?? []) {
      salida.push({ regla, origen: { tipo: 'slide', slideId: slide.id } });
    }
    const bloques = [
      ...(slide.bloques ?? []),
      ...(slide.capas ?? []).flatMap((capa) => capa.bloques),
    ];
    for (const bloque of bloques) {
      const bloqueId = idDeBloque(bloque);
      // Un bloque sin id no puede ser dueño de reglas (ver `idDeBloque`):
      // sus `disparadores`, si los hubiera, se ignoran en vez de adivinar.
      if (bloqueId === undefined) continue;
      for (const regla of bloque.disparadores ?? []) {
        salida.push({
          regla,
          origen: { tipo: 'bloque', bloqueId, slideId: slide.id },
        });
      }
    }
  }
  return salida;
}

/** Universo de ids contra el que `validarReglas` comprueba referencias. */
export interface ContextoValidacion {
  variables: readonly VariableDef[];
  bloqueIds: ReadonlySet<string>;
  slideIds: ReadonlySet<string>;
  capaIds: ReadonlySet<string>;
  /** N6 — estados personalizados declarados por bloque. */
  estadosPersonalizados?: Readonly<Record<string, readonly string[]>>;
}

export function contextoDesdeSlides(
  variables: readonly VariableDef[],
  slides: readonly SlideConReglas[],
): ContextoValidacion {
  const bloqueIds = new Set<string>();
  const slideIds = new Set<string>();
  const capaIds = new Set<string>();
  const estadosPersonalizados = estadosPersonalizadosPorBloque(slides);
  for (const slide of slides) {
    slideIds.add(slide.id);
    for (const b of slide.bloques ?? []) {
      const id = idDeBloque(b);
      if (id !== undefined) bloqueIds.add(id);
    }
    for (const capa of slide.capas ?? []) {
      capaIds.add(capa.id);
      for (const b of capa.bloques) {
        const id = idDeBloque(b);
        if (id !== undefined) bloqueIds.add(id);
      }
    }
  }
  return { variables, bloqueIds, slideIds, capaIds, estadosPersonalizados };
}
