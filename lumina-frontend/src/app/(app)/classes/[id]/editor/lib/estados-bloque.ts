import {
  ESTADOS_CON_APARIENCIA,
  MAX_ESTADOS_PERSONALIZADOS,
  MAX_NOMBRE_ESTADO,
  esEstadoBase,
  sanearApariencia,
} from '@lumina/interactions';
import { asegurarIdBloque } from '@lumina/editor-shared/block-id';
import type {
  AparienciaEstado,
  EstadoConApariencia,
} from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

/**
 * N6 — edición pura de `Block.apariencias` y `Block.estadosPersonalizados`.
 * Cada función devuelve un bloque nuevo (con id estable, D8) y deja el campo
 * ausente cuando queda vacío, para que un bloque sin estados serialice igual
 * que antes de N6.
 */

const vacia = (a: AparienciaEstado): boolean => Object.keys(a).length === 0;

export function etiquetaDeEstado(e: EstadoConApariencia): string {
  switch (e) {
    case 'normal':
      return 'Normal';
    case 'hover':
      return 'Al pasar el ratón';
    case 'down':
      return 'Al presionar';
    case 'visitado':
      return 'Visitado';
    case 'seleccionado':
      return 'Seleccionado';
    case 'deshabilitado':
      return 'Deshabilitado';
  }
}

export const ESTADOS_EDITABLES: readonly EstadoConApariencia[] = ESTADOS_CON_APARIENCIA;

function sinCampo(b: Block, campo: 'apariencias' | 'estadosPersonalizados'): Block {
  const { [campo]: _omit, ...rest } = b as Block & Record<string, unknown>;
  void _omit;
  return rest as Block;
}

/** Fija (o, con `{}`, quita) la apariencia de un estado base/hover/down. */
export function conAparienciaDeEstado(
  bloque: Block,
  estado: EstadoConApariencia,
  apariencia: AparienciaEstado,
): Block {
  const conId = asegurarIdBloque(bloque);
  const limpia = sanearApariencia(apariencia);
  const actual = { ...(conId.apariencias ?? {}) };
  if (vacia(limpia)) delete actual[estado];
  else actual[estado] = limpia;
  if (Object.keys(actual).length === 0) return sinCampo(conId, 'apariencias');
  return { ...conId, apariencias: actual } as Block;
}

/** Fija la apariencia de un estado personalizado (por id). */
export function conAparienciaDePersonalizado(
  bloque: Block,
  estadoId: string,
  apariencia: AparienciaEstado,
): Block {
  const conId = asegurarIdBloque(bloque);
  const lista = (conId.estadosPersonalizados ?? []).map((e) =>
    e.id === estadoId ? { ...e, apariencia: sanearApariencia(apariencia) } : e,
  );
  return { ...conId, estadosPersonalizados: lista } as Block;
}

export type ResultadoEdicion = { bloque: Block; error?: undefined } | { error: string };

export function conEstadoPersonalizado(
  bloque: Block,
  id: string,
  nombre: string,
): ResultadoEdicion {
  const n = nombre.trim();
  if (n === '') return { error: 'Ponle un nombre al estado.' };
  if (n.length > MAX_NOMBRE_ESTADO) {
    return { error: `El nombre admite hasta ${MAX_NOMBRE_ESTADO} caracteres.` };
  }
  const lista = bloque.estadosPersonalizados ?? [];
  if (lista.length >= MAX_ESTADOS_PERSONALIZADOS) {
    return { error: `Máximo ${MAX_ESTADOS_PERSONALIZADOS} estados personalizados por elemento.` };
  }
  if (lista.some((e) => e.nombre.trim().toLowerCase() === n.toLowerCase())) {
    return { error: 'Ya hay un estado con ese nombre.' };
  }
  if (esEstadoBase(id) || id === 'hover' || id === 'down' || lista.some((e) => e.id === id)) {
    return { error: 'Ese identificador ya existe.' };
  }
  const conId = asegurarIdBloque(bloque);
  return {
    bloque: {
      ...conId,
      estadosPersonalizados: [...lista, { id, nombre: n, apariencia: {} }],
    } as Block,
  };
}

export function renombrarEstadoPersonalizado(
  bloque: Block,
  id: string,
  nombre: string,
): ResultadoEdicion {
  const n = nombre.trim();
  if (n === '' || n.length > MAX_NOMBRE_ESTADO) {
    return { error: `El nombre debe tener entre 1 y ${MAX_NOMBRE_ESTADO} caracteres.` };
  }
  const lista = bloque.estadosPersonalizados ?? [];
  if (lista.some((e) => e.id !== id && e.nombre.trim().toLowerCase() === n.toLowerCase())) {
    return { error: 'Ya hay un estado con ese nombre.' };
  }
  return {
    bloque: {
      ...bloque,
      estadosPersonalizados: lista.map((e) => (e.id === id ? { ...e, nombre: n } : e)),
    } as Block,
  };
}

/** Quita un estado personalizado. El llamador ya verificó que ninguna regla lo usa. */
export function sinEstadoPersonalizado(bloque: Block, id: string): Block {
  const lista = (bloque.estadosPersonalizados ?? []).filter((e) => e.id !== id);
  const sinEstado = lista.length === 0 ? sinCampo(bloque, 'estadosPersonalizados') : bloque;
  return lista.length === 0 ? sinEstado : ({ ...bloque, estadosPersonalizados: lista } as Block);
}
