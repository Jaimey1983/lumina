// ─── Orden de apilado, alineación y grupos (W4) ───────────────────────────────

import type { Elemento, Escena, Grupo } from '../tipos.js';
import { cajaDeSeleccion, unirCajas, type Caja } from './geometria.js';
import { mover } from './transformar.js';
import {
  bloqueadosEfectivos,
  idParaTipo,
  mapaPadres,
  raizDe,
  sinDescendientes,
} from './utilidades.js';

// ─── Apilado ──────────────────────────────────────────────────────────────────

export type ModoOrden = 'frente' | 'fondo' | 'subir' | 'bajar';

interface Unidad {
  id: string;
  elementos: Elemento[];
}

/** Cada elemento de primer nivel (con su grupo y todos sus descendientes) en el orden en que aparece. */
function unidades(escena: Escena): Unidad[] {
  const padres = mapaPadres(escena);
  const porRaiz = new Map<string, Unidad>();
  const orden: Unidad[] = [];
  for (const e of escena.elementos) {
    const raiz = raizDe(e.id, padres);
    let u = porRaiz.get(raiz);
    if (!u) {
      u = { id: raiz, elementos: [] };
      porRaiz.set(raiz, u);
      orden.push(u);
    }
    u.elementos.push(e);
  }
  return orden;
}

/** Cambia el apilado. Un grupo se mueve entero. Devuelve la misma escena si el orden no cambia. */
export function reordenar(escena: Escena, ids: Iterable<string>, modo: ModoOrden): Escena {
  const padres = mapaPadres(escena);
  const existentes = new Set(escena.elementos.map((e) => e.id));
  const raices = new Set([...ids].filter((id) => existentes.has(id)).map((id) => raizDe(id, padres)));
  if (raices.size === 0) return escena;
  let lista = unidades(escena);
  const marcada = (u: Unidad): boolean => raices.has(u.id);

  if (modo === 'frente') lista = [...lista.filter((u) => !marcada(u)), ...lista.filter(marcada)];
  else if (modo === 'fondo') lista = [...lista.filter(marcada), ...lista.filter((u) => !marcada(u))];
  else if (modo === 'subir') {
    for (let i = lista.length - 2; i >= 0; i--) {
      const a = lista[i];
      const b = lista[i + 1];
      if (a && b && marcada(a) && !marcada(b)) [lista[i], lista[i + 1]] = [b, a];
    }
  } else {
    for (let i = 1; i < lista.length; i++) {
      const a = lista[i - 1];
      const b = lista[i];
      if (a && b && marcada(b) && !marcada(a)) [lista[i - 1], lista[i]] = [b, a];
    }
  }

  const nuevos = lista.flatMap((u) => u.elementos);
  if (nuevos.every((e, i) => e === escena.elementos[i])) return escena;
  return { ...escena, elementos: nuevos };
}

// ─── Alinear y distribuir ─────────────────────────────────────────────────────

export type ModoAlineacion = 'izquierda' | 'centro' | 'derecha' | 'arriba' | 'medio' | 'abajo';

export interface OpcionesAlinear {
  /** Con qué se alinea: la caja de la selección (por defecto) o los bordes de la escena. */
  respecto?: 'seleccion' | 'escena';
}

interface Pieza {
  id: string;
  caja: Caja;
}

function piezas(escena: Escena, ids: Iterable<string>): Pieza[] {
  const bloqueados = bloqueadosEfectivos(escena);
  const salida: Pieza[] = [];
  for (const id of sinDescendientes(escena, ids)) {
    if (bloqueados.has(id)) continue;
    const caja = cajaDeSeleccion(escena, [id]);
    if (caja) salida.push({ id, caja });
  }
  return salida;
}

export function alinear(escena: Escena, ids: Iterable<string>, modo: ModoAlineacion, opciones: OpcionesAlinear = {}): Escena {
  const lista = piezas(escena, ids);
  const respecto = opciones.respecto ?? 'seleccion';
  if (lista.length === 0 || (respecto === 'seleccion' && lista.length < 2)) return escena;
  const marco: Caja | null = respecto === 'escena' ? { x: 0, y: 0, ancho: escena.ancho, alto: escena.alto } : unirCajas(lista.map((p) => p.caja));
  if (!marco) return escena;
  let resultado = escena;
  for (const { id, caja } of lista) {
    let dx = 0;
    let dy = 0;
    if (modo === 'izquierda') dx = marco.x - caja.x;
    else if (modo === 'centro') dx = marco.x + marco.ancho / 2 - (caja.x + caja.ancho / 2);
    else if (modo === 'derecha') dx = marco.x + marco.ancho - (caja.x + caja.ancho);
    else if (modo === 'arriba') dy = marco.y - caja.y;
    else if (modo === 'medio') dy = marco.y + marco.alto / 2 - (caja.y + caja.alto / 2);
    else dy = marco.y + marco.alto - (caja.y + caja.alto);
    resultado = mover(resultado, [id], dx, dy);
  }
  return resultado;
}

/** Reparte con huecos iguales (hace falta al menos 3); los dos extremos quedan donde están. */
export function distribuir(escena: Escena, ids: Iterable<string>, eje: 'horizontal' | 'vertical'): Escena {
  const lista = piezas(escena, ids);
  if (lista.length < 3) return escena;
  const inicio = (c: Caja): number => (eje === 'horizontal' ? c.x : c.y);
  const medida = (c: Caja): number => (eje === 'horizontal' ? c.ancho : c.alto);
  const orden = [...lista].sort((a, b) => inicio(a.caja) - inicio(b.caja));
  const primero = orden[0];
  const ultimo = orden[orden.length - 1];
  if (!primero || !ultimo) return escena;
  const total = inicio(ultimo.caja) + medida(ultimo.caja) - inicio(primero.caja);
  const ocupado = orden.reduce((s, p) => s + medida(p.caja), 0);
  const hueco = (total - ocupado) / (orden.length - 1);
  let resultado = escena;
  let cursor = inicio(primero.caja);
  for (const p of orden) {
    const delta = cursor - inicio(p.caja);
    resultado = eje === 'horizontal' ? mover(resultado, [p.id], delta, 0) : mover(resultado, [p.id], 0, delta);
    cursor += medida(p.caja) + hueco;
  }
  return resultado;
}

// ─── Grupos ───────────────────────────────────────────────────────────────────

/** Reúne dos o más elementos (de primer nivel) en un grupo, ubicado en el apilado donde estaba el primero. */
export function agrupar(escena: Escena, ids: Iterable<string>): { escena: Escena; id: string } {
  const padres = mapaPadres(escena);
  const bloqueados = bloqueadosEfectivos(escena);
  const existentes = new Set(escena.elementos.map((e) => e.id));
  const raices = [...new Set([...ids].filter((id) => existentes.has(id)).map((id) => raizDe(id, padres)))].filter((id) => !bloqueados.has(id));
  if (raices.length < 2) return { escena, id: '' };
  const conjunto = new Set(raices);
  const hijos = escena.elementos.filter((e) => conjunto.has(e.id)).map((e) => e.id);
  const id = idParaTipo('grupo', new Set(escena.elementos.map((e) => e.id)));
  const grupo: Grupo = { id, tipo: 'grupo', hijos, bloqueado: false, oculto: false };
  // El grupo se coloca delante del primer elemento que reúne.
  const primero = escena.elementos.findIndex((e) => conjunto.has(e.id));
  const elementos = [...escena.elementos.slice(0, primero), grupo, ...escena.elementos.slice(primero)];
  return { escena: { ...escena, elementos }, id };
}

/** Deshace los grupos indicados (sus hijos quedan donde estaban). Devuelve los ids liberados. */
export function desagrupar(escena: Escena, ids: Iterable<string>): { escena: Escena; ids: string[] } {
  const pedidos = new Set(ids);
  const grupos = escena.elementos.filter((e): e is Grupo => e.tipo === 'grupo' && pedidos.has(e.id));
  if (grupos.length === 0) return { escena, ids: [] };
  const quitar = new Set(grupos.map((g) => g.id));
  const liberados = grupos.flatMap((g) => g.hijos).filter((h) => !quitar.has(h));
  const porId = new Map(grupos.map((g) => [g.id, g]));
  // Un grupo anidado que se deshace cede sus hijos al grupo que lo contenía.
  const aplanar = (hijos: string[]): string[] => hijos.flatMap((h) => (porId.has(h) ? aplanar(porId.get(h)?.hijos ?? []) : [h]));
  const elementos = escena.elementos
    .filter((e) => !quitar.has(e.id))
    .map((e) => (e.tipo === 'grupo' && e.hijos.some((h) => quitar.has(h)) ? { ...e, hijos: aplanar(e.hijos) } : e));
  return { escena: { ...escena, elementos }, ids: liberados };
}
