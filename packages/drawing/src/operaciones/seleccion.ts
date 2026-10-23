// ─── Selección avanzada (Y15) ─────────────────────────────────────────────────
// Puro: cada función recibe la escena y devuelve ids de elementos de primer nivel (un grupo cuenta como una unidad,
// como el clic), en orden de apilado. Siempre se excluyen los bloqueados y los ocultos. Elegir no es un cambio de la
// escena: nada de esto toca el historial.

import { eliminarRama } from './rama.js';
import { cajaDeElemento } from './geometria.js';
import { bloqueadosEfectivos, mapaPadres, ocultosEfectivos, raizDe } from './utilidades.js';
import type { Elemento, Escena, Forma, Punto } from '../tipos.js';

export type TipoSeleccionable = 'forma' | 'linea' | 'texto';

/** Elementos de primer nivel que se pueden elegir: ni dentro de un grupo, ni ocultos, ni bloqueados. */
export function unidadesElegibles(escena: Escena): Elemento[] {
  const padres = mapaPadres(escena);
  const bloqueados = bloqueadosEfectivos(escena);
  const ocultos = ocultosEfectivos(escena);
  return escena.elementos.filter((e) => !padres.has(e.id) && !bloqueados.has(e.id) && !ocultos.has(e.id));
}

/** Tipos de las hojas (no grupos) de un elemento, bajando por los grupos. */
function tiposDeHojas(escena: Escena, e: Elemento, vistos = new Set<string>()): Set<TipoSeleccionable> {
  const tipos = new Set<TipoSeleccionable>();
  if (vistos.has(e.id)) return tipos;
  vistos.add(e.id);
  if (e.tipo !== 'grupo') return tipos.add(e.tipo);
  for (const id of e.hijos) {
    const h = escena.elementos.find((x) => x.id === id);
    if (h) for (const t of tiposDeHojas(escena, h, vistos)) tipos.add(t);
  }
  return tipos;
}

/** Todas las formas, todos los conectores o todos los textos. Un grupo entra si alguna de sus hojas es de ese tipo. */
export function seleccionarPorTipo(escena: Escena, tipo: TipoSeleccionable): string[] {
  return unidadesElegibles(escena)
    .filter((e) => tiposDeHojas(escena, e).has(tipo))
    .map((e) => e.id);
}

/** Lo que hace «igual» a dos formas: el tipo de forma, el relleno y el contorno (no el tamaño, el texto ni la opacidad). */
const firma = (f: Forma): string => JSON.stringify([f.forma, f.estilo.relleno, f.estilo.contorno]);

/** Las formas de `ids` y las que hay dentro de los grupos que se pidan. */
function formasDe(escena: Escena, ids: readonly string[]): Forma[] {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const salida: Forma[] = [];
  const vistos = new Set<string>();
  const visitar = (id: string): void => {
    if (vistos.has(id)) return;
    vistos.add(id);
    const e = porId.get(id);
    if (e?.tipo === 'forma') salida.push(e);
    else if (e?.tipo === 'grupo') e.hijos.forEach(visitar);
  };
  ids.forEach(visitar);
  return salida;
}

/**
 * Las formas de primer nivel con el mismo tipo de forma, relleno y contorno que alguna de las elegidas (las propias
 * elegidas incluidas). Sin ninguna forma entre lo elegido, no hay con qué comparar: lista vacía.
 */
export function seleccionarIguales(escena: Escena, seleccion: readonly string[]): string[] {
  const firmas = new Set(formasDe(escena, seleccion).map(firma));
  if (firmas.size === 0) return [];
  return unidadesElegibles(escena)
    .filter((e): e is Forma => e.tipo === 'forma' && firmas.has(firma(e)))
    .map((e) => e.id);
}

/** Todo lo elegible que NO está en la selección. Invertir dos veces devuelve lo elegible que había elegido. */
export function invertirSeleccion(escena: Escena, seleccion: readonly string[]): string[] {
  const elegidos = new Set(seleccion);
  return unidadesElegibles(escena)
    .filter((e) => !elegidos.has(e.id))
    .map((e) => e.id);
}

/**
 * La forma y todo lo que cuelga de ella (la lógica de «Borrar rama», Y9: lo que solo se alcanza bajando por conectores
 * salientes), más los conectores que unen formas de la rama. Una forma dentro de un grupo se elige como su grupo.
 * Si `raizId` no es una forma que se pueda elegir, lista vacía.
 */
export function seleccionarRama(escena: Escena, raizId: string): string[] {
  const raiz = escena.elementos.find((e) => e.id === raizId);
  if (raiz?.tipo !== 'forma') return [];
  // Las formas de la rama son las que «Borrar rama» quitaría: así las dos órdenes no pueden discrepar.
  const despues = new Set(eliminarRama(escena, raizId).elementos.map((e) => e.id));
  const rama = new Set(escena.elementos.filter((e) => e.tipo === 'forma' && !despues.has(e.id)).map((e) => e.id));
  if (!rama.has(raizId)) return [];
  const padres = mapaPadres(escena);
  const elegibles = new Set(unidadesElegibles(escena).map((e) => e.id));
  const unidades = new Set<string>();
  for (const id of rama) unidades.add(raizDe(id, padres));
  for (const e of escena.elementos) {
    if (e.tipo === 'linea' && e.origen && e.destino && rama.has(e.origen.elementoId) && rama.has(e.destino.elementoId)) unidades.add(raizDe(e.id, padres));
  }
  return escena.elementos.filter((e) => unidades.has(e.id) && elegibles.has(e.id)).map((e) => e.id);
}

/** Regla par-impar: sirve para polígonos cóncavos y que se cruzan a sí mismos. */
export function puntoEnPoligono(punto: Punto, poligono: readonly Punto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i] as Punto;
    const b = poligono[j] as Punto;
    if (a.y > punto.y !== b.y > punto.y && punto.x < ((b.x - a.x) * (punto.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

/**
 * Los elementos de primer nivel cuyo CENTRO queda dentro del polígono (el lazo). Con menos de 3 puntos no hay área:
 * lista vacía.
 */
export function elementosEnPoligono(escena: Escena, poligono: readonly Punto[]): string[] {
  if (poligono.length < 3) return [];
  const salida: string[] = [];
  for (const e of unidadesElegibles(escena)) {
    const c = cajaDeElemento(escena, e);
    if (c && puntoEnPoligono({ x: c.x + c.ancho / 2, y: c.y + c.alto / 2 }, poligono)) salida.push(e.id);
  }
  return salida;
}
