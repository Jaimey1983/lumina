import {
  generarMapaDeIds,
  limpiarReferenciasABloque,
  limpiarReferenciasASlide,
  referenciasA,
  remapearIds,
} from '@lumina/interactions';
import type { SlideMotor } from '@lumina/interactions';
import type { Block } from '@lumina/types/slide';

import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';

/**
 * Integridad referencial de las reglas en el editor (K7b).
 *
 * Funciones puras sobre el `content` CRUDO de un slide (`ApiSlide.content`):
 * lo que hay que guardar tras duplicar o borrar. La lógica de ids vive en
 * `@lumina/interactions`; aquí solo se adapta al formato que guarda el editor.
 */

export type Contenido = Record<string, unknown>;

/** El slide tal como lo ve el motor (id de base de datos + bloques/capas/reglas). */
export function comoSlideMotor(id: string, contenido: Contenido): SlideMotor {
  return {
    id,
    bloques: Array.isArray(contenido.bloques) ? (contenido.bloques as Block[]) : [],
    ...(Array.isArray(contenido.capas) ? { capas: contenido.capas as SlideMotor['capas'] } : {}),
    ...(Array.isArray(contenido.reglas) ? { reglas: contenido.reglas as SlideMotor['reglas'] } : {}),
  };
}

function volcar(contenido: Contenido, s: SlideMotor): Contenido {
  return {
    ...contenido,
    bloques: s.bloques ?? [],
    ...(s.capas !== undefined ? { capas: s.capas } : {}),
    ...(s.reglas !== undefined ? { reglas: s.reglas } : {}),
  };
}

/** Slides del mazo para el motor (misma normalización que usa el reproductor). */
export function slidesParaMotor(slides: readonly ApiSlide[]): SlideMotor[] {
  return slides.map((s) => {
    const r = classSlideToRendererSlide(s);
    return {
      id: s.id,
      bloques: r.bloques,
      ...(r.capas !== undefined ? { capas: r.capas } : {}),
      ...(r.reglas !== undefined ? { reglas: r.reglas } : {}),
    };
  });
}

/**
 * Contenido de la COPIA de un slide: ids de bloque, capa y regla nuevos y las
 * reglas internas remapeadas. Las que apuntan al propio slide siguen apuntando
 * al original hasta que el servidor da el id de la copia (`reapuntarACopia`).
 */
export function contenidoParaCopia(
  contenido: Contenido,
  slideId: string,
  nuevoId: () => string = () => crypto.randomUUID(),
): Contenido {
  const origen = comoSlideMotor(slideId, contenido);
  return volcar(contenido, remapearIds(origen, generarMapaDeIds(origen, nuevoId)));
}

/**
 * Segundo guardado de «duplicar slide»: las reglas de la copia que iban al slide
 * original pasan a ir a la copia. `cambio` dice si hay algo que guardar.
 */
export function reapuntarACopia(
  contenido: Contenido,
  origenId: string,
  copiaId: string,
): { contenido: Contenido; cambio: boolean } {
  const nuevo = volcar(
    contenido,
    remapearIds(comoSlideMotor(copiaId, contenido), { slides: { [origenId]: copiaId } }),
  );
  return { contenido: nuevo, cambio: JSON.stringify(nuevo) !== JSON.stringify(contenido) };
}

/** Reglas ajenas que dependen del slide que se va a borrar (para el confirm). */
export function dependenciasDeSlide(slides: readonly SlideMotor[], slideId: string) {
  return referenciasA(slides, { tipo: 'slide', id: slideId });
}

/** Reglas ajenas que dependen del bloque que se va a borrar (mismo slide). */
export function dependenciasDeBloque(slide: SlideMotor, bloqueId: string) {
  return referenciasA([slide], { tipo: 'bloque', id: bloqueId });
}

export interface CambioDeSlide {
  slideId: string;
  contenido: Contenido;
}

/**
 * Tras borrar un slide: contenido nuevo de cada slide RESTANTE cuyas reglas lo
 * mencionaban. Solo se devuelven los que cambian.
 */
export function limpiarMazoTrasBorrarSlide(
  slides: readonly { id: string; content: Contenido }[],
  slideBorradoId: string,
): { cambios: CambioDeSlide[]; eliminadas: string[]; desactivadas: string[] } {
  const restantes = slides.filter((s) => s.id !== slideBorradoId);
  const r = limpiarReferenciasASlide(
    restantes.map((s) => comoSlideMotor(s.id, s.content)),
    slideBorradoId,
  );
  const cambios = r.slidesCambiados.map((id) => {
    const original = restantes.find((s) => s.id === id)!;
    const limpio = r.resultado.find((s) => s.id === id)!;
    return { slideId: id, contenido: volcar(original.content, limpio) };
  });
  return { cambios, eliminadas: r.eliminadas, desactivadas: r.desactivadas };
}

/**
 * Tras borrar un bloque: bloques (y reglas de slide) ya limpios. `bloquesSin`
 * son los bloques DESPUÉS de quitarlo. `reglas` solo viene si cambió.
 */
export function limpiarSlideTrasBorrarBloque(
  slideId: string,
  bloquesSin: Block[],
  extras: { capas?: SlideMotor['capas']; reglas?: SlideMotor['reglas'] },
  bloqueBorradoId: string,
): {
  bloques: Block[];
  reglas?: NonNullable<SlideMotor['reglas']>;
  eliminadas: string[];
  desactivadas: string[];
} {
  const r = limpiarReferenciasABloque(
    {
      id: slideId,
      bloques: bloquesSin,
      ...(extras.capas !== undefined ? { capas: extras.capas } : {}),
      ...(extras.reglas !== undefined ? { reglas: extras.reglas } : {}),
    },
    bloqueBorradoId,
  );
  const reglasCambiaron = r.resultado.reglas !== extras.reglas;
  return {
    bloques: r.resultado.bloques ?? bloquesSin,
    ...(reglasCambiaron && r.resultado.reglas ? { reglas: r.resultado.reglas } : {}),
    eliminadas: r.eliminadas,
    desactivadas: r.desactivadas,
  };
}
