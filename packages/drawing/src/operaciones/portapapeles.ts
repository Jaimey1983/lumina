// ─── Copiar y pegar elementos (Y12a) ──────────────────────────────────────────
// Lógica pura: arma un fragmento serializable con lo elegido y lo pega en una escena con ids nuevos.
// Lo que viene de fuera (el portapapeles del sistema) NO es de fiar: `validarFragmento` lo comprueba y todo
// lo que entra a la escena pasa por `normalizarEscena` (único escritor, DW5).

import { LIMITES, normalizarEscena } from '../normalizar.js';
import type { Elemento, Escena, Linea, Punto } from '../tipos.js';
import { cajaDeElemento, unirCajas } from './geometria.js';
import { esConCaja, expandir, idNuevo, sinDescendientes } from './utilidades.js';

export const FORMATO_FRAGMENTO = 'lumina-dibujo';
export const VERSION_FRAGMENTO = 1;
/** Elementos que caben en un fragmento (copiar y pegar rechazan lo que pase de aquí). */
export const MAX_ELEMENTOS_FRAGMENTO = 500;
/** Tamaño máximo del fragmento serializado, en caracteres. */
export const MAX_TAMANO_FRAGMENTO = 1_000_000;
/** Cuánto se desplaza cada pegado respecto del anterior, en unidades de escena. */
export const DESPLAZAMIENTO_PEGADO = 20;

export interface Fragmento {
  formato: typeof FORMATO_FRAGMENTO;
  version: typeof VERSION_FRAGMENTO;
  /** En orden de apilado, con los ids de la escena de origen (al pegar se renombran). */
  elementos: Elemento[];
}

/**
 * Fragmento con lo elegido, los hijos de los grupos y los conectores cuyos dos extremos están dentro.
 * Un conector elegido con un extremo fuera conserva la forma y queda con ese extremo suelto.
 * `null` si no hay nada que copiar.
 */
export function copiar(escena: Escena, ids: Iterable<string>): Fragmento | null {
  const originales = expandir(escena, sinDescendientes(escena, ids));
  if (originales.size === 0) return null;
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || originales.has(e.id)) continue;
    const o = e.origen?.elementoId;
    const d = e.destino?.elementoId;
    if (o && d && originales.has(o) && originales.has(d)) originales.add(e.id);
  }
  const elementos: Elemento[] = [];
  for (const e of escena.elementos) {
    if (!originales.has(e.id)) continue;
    if (e.tipo === 'linea') {
      const { origen, destino, ...resto } = e;
      elementos.push({
        ...resto,
        ...(origen && originales.has(origen.elementoId) ? { origen: { ...origen } } : {}),
        ...(destino && originales.has(destino.elementoId) ? { destino: { ...destino } } : {}),
      });
    } else {
      elementos.push(JSON.parse(JSON.stringify(e)) as Elemento);
    }
  }
  return { formato: FORMATO_FRAGMENTO, version: VERSION_FRAGMENTO, elementos };
}

/**
 * Comprueba un dato que viene de fuera (el portapapeles). Devuelve el fragmento normalizado, o `null` si no es un
 * fragmento válido: no es un objeto, es de otro formato o versión, está vacío, pasa del límite, repite ids, o
 * algún elemento no se pudo leer (el normalizador lo descartaría y el resultado ya no sería lo copiado).
 */
export function validarFragmento(dato: unknown): Fragmento | null {
  try {
    return validarSinProteccion(dato);
  } catch {
    return null; // getters que lanzan, proxies hostiles…
  }
}

function validarSinProteccion(dato: unknown): Fragmento | null {
  if (typeof dato !== 'object' || dato === null || Array.isArray(dato)) return null;
  const crudo = dato as Record<string, unknown>;
  if (crudo.formato !== FORMATO_FRAGMENTO || crudo.version !== VERSION_FRAGMENTO) return null;
  const entrada = crudo.elementos;
  if (!Array.isArray(entrada) || entrada.length === 0 || entrada.length > MAX_ELEMENTOS_FRAGMENTO) return null;
  const ids = new Set<string>();
  for (const e of entrada) {
    const id = typeof e === 'object' && e !== null ? (e as Record<string, unknown>).id : undefined;
    if (typeof id !== 'string' || id === '' || ids.has(id)) return null;
    ids.add(id);
  }
  const normal = normalizarEscena({ elementos: entrada });
  if (normal.elementos.length !== entrada.length) return null;
  // El normalizador puede cambiar un id ilegible: si no se conservan, las referencias del fragmento se romperían.
  if (!normal.elementos.every((e, i) => e.id === (entrada[i] as Record<string, unknown>).id)) return null;
  return { formato: FORMATO_FRAGMENTO, version: VERSION_FRAGMENTO, elementos: normal.elementos };
}

/** Caja que envuelve a todo el fragmento (en las coordenadas de su escena de origen). */
export function cajaDeFragmento(fragmento: Fragmento): ReturnType<typeof unirCajas> {
  const tmp = normalizarEscena({ elementos: fragmento.elementos });
  return unirCajas(tmp.elementos.filter((e) => e.tipo !== 'grupo').map((e) => cajaDeElemento(tmp, e)));
}

export interface OpcionesPegar {
  /** Desplazamiento respecto de donde estaba (por defecto, ninguno: «en el mismo sitio»). */
  desplazamiento?: Punto;
  /** Centro de lo pegado: manda sobre `desplazamiento`. */
  centro?: Punto;
}

export interface ResultadoPegar {
  escena: Escena;
  /** Lo que queda elegido: los elementos de primer nivel pegados, sin los conectores que siguen a sus dos formas. */
  ids: string[];
  /** Por qué no se pegó nada, si es el caso. */
  motivo?: 'vacio' | 'demasiados';
}

/**
 * Pega el fragmento al frente de la escena con ids nuevos. Los conectores internos se unen a las copias; un extremo
 * que apuntaba fuera del fragmento queda suelto (nunca se pega a una forma de la escena de destino). Lo pegado sale
 * desbloqueado: un elemento pegado que no se pudiera elegir no se podría mover.
 */
export function pegar(escena: Escena, fragmento: Fragmento, opciones: OpcionesPegar = {}): ResultadoPegar {
  const entrada = fragmento.elementos;
  if (entrada.length === 0) return { escena, ids: [], motivo: 'vacio' };
  if (escena.elementos.length + entrada.length > LIMITES.elementos) return { escena, ids: [], motivo: 'demasiados' };

  let dx = opciones.desplazamiento?.x ?? 0;
  let dy = opciones.desplazamiento?.y ?? 0;
  if (opciones.centro) {
    const caja = cajaDeFragmento(fragmento);
    if (caja) {
      dx = opciones.centro.x - (caja.x + caja.ancho / 2);
      dy = opciones.centro.y - (caja.y + caja.alto / 2);
    }
  }

  const usados = new Set(escena.elementos.map((e) => e.id));
  const nuevos = new Map<string, string>();
  for (const e of entrada) {
    const id = idNuevo(e.id, usados);
    usados.add(id);
    nuevos.set(e.id, id);
  }

  const copias: Elemento[] = entrada.map((e): Elemento => {
    const id = nuevos.get(e.id) ?? e.id;
    if (e.tipo === 'grupo') {
      return { ...e, id, bloqueado: false, hijos: e.hijos.flatMap((h) => nuevos.get(h) ?? []) };
    }
    if (esConCaja(e)) {
      return { ...e, id, bloqueado: false, transformacion: { ...e.transformacion, x: e.transformacion.x + dx, y: e.transformacion.y + dy } } as Elemento;
    }
    const { origen, destino, ...resto } = e as Linea;
    const o = origen ? nuevos.get(origen.elementoId) : undefined;
    const d = destino ? nuevos.get(destino.elementoId) : undefined;
    return {
      ...resto,
      id,
      bloqueado: false,
      puntos: e.puntos.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      ...(origen && o ? { origen: { ...origen, elementoId: o } } : {}),
      ...(destino && d ? { destino: { ...destino, elementoId: d } } : {}),
    };
  });

  const resultado = normalizarEscena({ ...escena, elementos: [...escena.elementos, ...copias] });
  const pegados = new Set(copias.map((c) => c.id));
  const hijosDeGrupo = new Set(copias.flatMap((c) => (c.tipo === 'grupo' ? c.hijos : [])));
  const ids = copias
    .filter((c) => !hijosDeGrupo.has(c.id) && !(c.tipo === 'linea' && c.origen && c.destino && pegados.has(c.origen.elementoId) && pegados.has(c.destino.elementoId)))
    .map((c) => c.id);
  return { escena: resultado, ids };
}
