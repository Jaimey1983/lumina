import type { VariableDef } from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import type { ReglaAplicable } from './tipos.js';

type SlideConReglas = Pick<Slide, 'id' | 'bloques' | 'capas' | 'reglas'>;

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
}

export function contextoDesdeSlides(
  variables: readonly VariableDef[],
  slides: readonly SlideConReglas[],
): ContextoValidacion {
  const bloqueIds = new Set<string>();
  const slideIds = new Set<string>();
  const capaIds = new Set<string>();
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
  return { variables, bloqueIds, slideIds, capaIds };
}
