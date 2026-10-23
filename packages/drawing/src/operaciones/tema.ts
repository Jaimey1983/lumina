// ─── Temas: colorear un diagrama por ramas con una paleta (Y21) ───────────────
// Un tema es una acción, no un estado: la escena no guarda qué paleta se usó. Cambia solo colores.

import type { Escena, Forma, Linea } from '../tipos.js';
import { cambiarEstilo, type ParcheVisual } from './edicion.js';
import { hojasEditables } from './utilidades.js';

/** Los colores de una paleta: el acento va a la raíz de cada árbol y los demás, a las ramas. */
export interface PaletaColores {
  acento: string;
  colores: readonly string[];
}

/** Alfa del relleno de una forma coloreada: el 14 % (como `TINTE_PORCENTAJE` del diagrama de grafo), en hex. */
export const ALFA_TINTE = '24';

/** Color del texto de una forma coloreada: el del tema, así el contraste es el de la app en cualquier modo. */
export const COLOR_TEXTO_TEMA = 'var(--foreground)';

const RE_HEX6 = /^#[0-9a-f]{6}$/i;
const tinte = (color: string): string => (RE_HEX6.test(color) ? `${color.toUpperCase()}${ALFA_TINTE}` : color);

/**
 * El color de cada forma de `ids`, repartido por ramas con los conectores `origen → destino` que hay entre ellas: la raíz (la forma sin
 * conector entrante; si hay un ciclo, la primera) toma el acento, sus hijos directos toman `colores` en el orden de los conectores y
 * los descendientes heredan el de su rama. Una forma suelta es una raíz.
 */
export function coloresPorRama(escena: Escena, ids: ReadonlySet<string>, paleta: PaletaColores): Map<string, string> {
  const hijos = new Map<string, string[]>();
  const conEntrada = new Set<string>();
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || !e.origen || !e.destino) continue;
    const o = e.origen.elementoId;
    const d = e.destino.elementoId;
    if (!ids.has(o) || !ids.has(d) || o === d) continue;
    hijos.set(o, [...(hijos.get(o) ?? []), d]);
    conEntrada.add(d);
  }
  const orden = escena.elementos.filter((e) => ids.has(e.id)).map((e) => e.id);
  const color = new Map<string, string>();
  const recorrer = (raiz: string): void => {
    color.set(raiz, paleta.acento);
    const cola: string[] = [];
    (hijos.get(raiz) ?? []).forEach((h, i) => {
      if (color.has(h)) return;
      color.set(h, paleta.colores.length > 0 ? (paleta.colores[i % paleta.colores.length] as string) : paleta.acento);
      cola.push(h);
    });
    while (cola.length > 0) {
      const padre = cola.shift() as string;
      for (const h of hijos.get(padre) ?? []) {
        if (color.has(h)) continue;
        color.set(h, color.get(padre) as string);
        cola.push(h);
      }
    }
  };
  for (const id of orden) if (!conEntrada.has(id) && !color.has(id)) recorrer(id);
  // Lo que queda son ciclos sin raíz: la primera forma sin color empieza un árbol.
  for (const id of orden) if (!color.has(id)) recorrer(id);
  return color;
}

/**
 * Colorea por ramas las formas editables de `ids` (los grupos aportan sus hojas) y los conectores que las unen: contorno = el color de la
 * rama, relleno = ese color con 14 % de alfa y texto = `var(--foreground)`; un conector toma el color de su destino (o de su origen si
 * el destino queda fuera). No toca geometría, tipografía, sombra, grosor ni los textos libres. Devuelve la misma escena si no cambia nada.
 */
export function aplicarPaleta(escena: Escena, ids: Iterable<string>, paleta: PaletaColores): Escena {
  const formas = hojasEditables(escena, ids).filter((h): h is Forma => h.tipo === 'forma');
  if (formas.length === 0) return escena;
  const alcance = new Set(formas.map((f) => f.id));
  const colores = coloresPorRama(escena, alcance, paleta);

  const porColor = new Map<string, string[]>();
  for (const f of formas) {
    const c = colores.get(f.id) as string;
    const ya = f.estilo.contorno.color === c && f.estilo.relleno.tipo === 'solido' && f.estilo.relleno.color === tinte(c) && f.estiloTexto.color === COLOR_TEXTO_TEMA;
    if (!ya) porColor.set(c, [...(porColor.get(c) ?? []), f.id]);
  }
  const lineas = new Map<string, string[]>();
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || !e.origen || !e.destino || e.bloqueado) continue;
    const c = colores.get(e.destino.elementoId) ?? colores.get(e.origen.elementoId);
    if (c !== undefined && (e as Linea).estilo.contorno.color !== c) lineas.set(c, [...(lineas.get(c) ?? []), e.id]);
  }
  if (porColor.size === 0 && lineas.size === 0) return escena;

  let r = escena;
  for (const [c, ids2] of porColor) {
    const parche: ParcheVisual = { estilo: { relleno: { tipo: 'solido', color: tinte(c) }, contorno: { color: c } }, estiloTexto: { color: COLOR_TEXTO_TEMA } };
    r = cambiarEstilo(r, ids2, parche);
  }
  for (const [c, ids2] of lineas) r = cambiarEstilo(r, ids2, { estilo: { contorno: { color: c } } });
  return r;
}
