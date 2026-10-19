// ─── Puertos de las formas (W7) ───────────────────────────────────────────────
// Dónde está cada puerto en la escena y hacia qué lado «sale» un conector que se pega a él.

import { puertosForma } from '../formas/index.js';
import type { Escena, Forma, Punto } from '../tipos.js';

export type Lado = 'arriba' | 'derecha' | 'abajo' | 'izquierda';

export const VECTOR_LADO: Record<Lado, Punto> = {
  arriba: { x: 0, y: -1 },
  derecha: { x: 1, y: 0 },
  abajo: { x: 0, y: 1 },
  izquierda: { x: -1, y: 0 },
};

export const LADO_OPUESTO: Record<Lado, Lado> = { arriba: 'abajo', abajo: 'arriba', derecha: 'izquierda', izquierda: 'derecha' };

function girar(p: Punto, centro: Punto, grados: number): Punto {
  if (grados === 0) return p;
  const a = (grados * Math.PI) / 180;
  const dx = p.x - centro.x;
  const dy = p.y - centro.y;
  return { x: centro.x + dx * Math.cos(a) - dy * Math.sin(a), y: centro.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

function puertosLocales(forma: Forma): Punto[] {
  const t = forma.transformacion;
  return puertosForma(forma.forma, t.ancho, t.alto, { parametros: forma.parametros, radio: forma.estilo.radio });
}

/** Posición en la escena del puerto `puerto` de una forma (con su rotación). Un índice inexistente cae en el primer puerto. */
export function puntoDePuerto(forma: Forma, puerto: number): Punto {
  const t = forma.transformacion;
  const puertos = puertosLocales(forma);
  const local = puertos[puerto] ?? puertos[0] ?? { x: t.ancho / 2, y: t.alto / 2 };
  const rotado = girar(local, { x: t.ancho / 2, y: t.alto / 2 }, t.rotacion);
  return { x: t.x + rotado.x, y: t.y + rotado.y };
}

/** Cantidad de puertos de una forma. */
export const cantidadDePuertos = (forma: Forma): number => puertosLocales(forma).length;

/**
 * Lado hacia el que «sale» un conector pegado al puerto: el eje en el que el puerto se aleja más del
 * centro de la forma, ya con el giro de la forma aplicado (se redondea al lado más cercano).
 */
export function ladoDePuerto(forma: Forma, puerto: number): Lado {
  const t = forma.transformacion;
  const puertos = puertosLocales(forma);
  const local = puertos[puerto] ?? puertos[0] ?? { x: t.ancho / 2, y: 0 };
  const nx = (local.x - t.ancho / 2) / Math.max(t.ancho / 2, 1e-9);
  const ny = (local.y - t.alto / 2) / Math.max(t.alto / 2, 1e-9);
  const saliente = Math.abs(nx) >= Math.abs(ny) ? { x: Math.sign(nx) || 1, y: 0 } : { x: 0, y: Math.sign(ny) || -1 };
  const v = girar(saliente, { x: 0, y: 0 }, t.rotacion);
  if (Math.abs(v.x) >= Math.abs(v.y)) return v.x >= 0 ? 'derecha' : 'izquierda';
  return v.y >= 0 ? 'abajo' : 'arriba';
}

export interface PuertoDeEscena {
  elementoId: string;
  puerto: number;
  punto: Punto;
  lado: Lado;
}

/** Ids de las formas que no se ven (ocultas, o dentro de un grupo oculto): no ofrecen puertos. */
function ocultas(escena: Escena): Set<string> {
  const salida = new Set<string>();
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const ocultar = (id: string): void => {
    if (salida.has(id)) return;
    salida.add(id);
    const e = porId.get(id);
    if (e?.tipo === 'grupo') e.hijos.forEach(ocultar);
  };
  for (const e of escena.elementos) if (e.oculto) ocultar(e.id);
  return salida;
}

/** Formas que se ven (no ocultas ni dentro de un grupo oculto), en el orden de apilado. */
export function formasVisibles(escena: Escena): Forma[] {
  const invisibles = ocultas(escena);
  return escena.elementos.filter((e): e is Forma => e.tipo === 'forma' && !invisibles.has(e.id));
}

/** Todos los puertos de las formas visibles, en el orden de apilado (las de arriba, al final). */
export function puertosDeEscena(escena: Escena): PuertoDeEscena[] {
  const salida: PuertoDeEscena[] = [];
  for (const e of formasVisibles(escena)) {
    const n = cantidadDePuertos(e);
    for (let i = 0; i < n; i++) salida.push({ elementoId: e.id, puerto: i, punto: puntoDePuerto(e, i), lado: ladoDePuerto(e, i) });
  }
  return salida;
}

export interface PuertoCercano extends PuertoDeEscena {
  distancia: number;
}

/** El puerto más cercano a `punto` dentro de `radio` (en unidades de escena). En un empate gana la forma de más arriba. */
export function puertoCercano(escena: Escena, punto: Punto, radio: number): PuertoCercano | null {
  let mejor: PuertoCercano | null = null;
  for (const p of puertosDeEscena(escena)) {
    const distancia = Math.hypot(p.punto.x - punto.x, p.punto.y - punto.y);
    if (distancia > radio) continue;
    if (!mejor || distancia <= mejor.distancia) mejor = { ...p, distancia };
  }
  return mejor;
}
