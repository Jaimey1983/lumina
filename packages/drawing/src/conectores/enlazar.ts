// ─── Elegir los puertos al conectar dos formas (Y7) ───────────────────────────
// Dadas dos formas, qué puerto de cada una conviene usar para unirlas. Lógica pura, sin tocar la escena.

import { agregar } from '../operaciones/edicion.js';
import type { Conexion, Escena, Forma } from '../tipos.js';
import { sincronizarConectores } from './conectar.js';
import { cantidadDePuertos, formasVisibles, ladoDePuerto, puntoDePuerto, VECTOR_LADO } from './puertos.js';

/**
 * Lo que se suma a la distancia de un par de puertos si alguno «sale» hacia el lado contrario de la otra
 * forma (un conector que sale por detrás y da la vuelta). Grande a propósito: solo se elige un par así si
 * no hay otro.
 */
const PENALIZACION_DE_ESPALDAS = 1e6;

/**
 * Cuánto puede «mirar hacia atrás» un puerto sin penalizarlo (unidades de escena). Con las formas pegadas, los dos
 * puertos de contacto coinciden y el producto escalar vale 0 ± un error de redondeo (un píxel arrastrado no
 * cae exacto): sin esta holgura, el par de contacto —el obvio— se descartaba por un -0,0000001.
 */
const HOLGURA_DE_ESPALDAS = 1;

export interface ParDePuertos {
  /** Puerto de la forma `origen`. */
  origen: Conexion;
  /** Puerto de la forma `destino`. */
  destino: Conexion;
}

/**
 * El par de puertos con el que se conectan `origenId` y `destinoId`: los más cercanos entre sí que miran el
 * uno hacia el otro. Con una forma debajo de la otra, sale el de abajo de la de arriba y entra el de arriba
 * de la de abajo; igual en horizontal. Respeta el giro y la forma de cada una (sus puertos y su lado de
 * salida se calculan con la rotación). Con un empate gana el primero (el de menor índice).
 *
 * Devuelve `null` si alguna no es una forma visible, no hay puertos o son la misma.
 */
export function puertosParaConectar(escena: Escena, origenId: string, destinoId: string): ParDePuertos | null {
  if (origenId === destinoId) return null;
  const visibles = formasVisibles(escena);
  const o = visibles.find((f) => f.id === origenId);
  const d = visibles.find((f) => f.id === destinoId);
  if (!o || !d) return null;
  const nO = cantidadDePuertos(o);
  const nD = cantidadDePuertos(d);
  let mejor: { puntaje: number; po: number; pd: number } | null = null;
  for (let i = 0; i < nO; i++) {
    const a = puntoDePuerto(o, i);
    const salidaO = VECTOR_LADO[ladoDePuerto(o, i)];
    for (let j = 0; j < nD; j++) {
      const b = puntoDePuerto(d, j);
      const salidaD = VECTOR_LADO[ladoDePuerto(d, j)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let puntaje = Math.hypot(dx, dy);
      // Mira «de espaldas» si su salida apunta contra la dirección hacia el otro puerto.
      if (salidaO.x * dx + salidaO.y * dy < -HOLGURA_DE_ESPALDAS) puntaje += PENALIZACION_DE_ESPALDAS;
      if (salidaD.x * -dx + salidaD.y * -dy < -HOLGURA_DE_ESPALDAS) puntaje += PENALIZACION_DE_ESPALDAS;
      if (!mejor || puntaje < mejor.puntaje) mejor = { puntaje, po: i, pd: j };
    }
  }
  return mejor ? { origen: { elementoId: origenId, puerto: mejor.po }, destino: { elementoId: destinoId, puerto: mejor.pd } } : null;
}

/** ¿Ya hay un conector que va de `padreId` a `hijaId`? (el sentido contrario no cuenta) */
export function existeConector(escena: Escena, padreId: string, hijaId: string): boolean {
  return escena.elementos.some((e) => e.tipo === 'linea' && e.origen?.elementoId === padreId && e.destino?.elementoId === hijaId);
}

/**
 * Escena con un conector nuevo del padre a la hija (ortogonal, con flecha), pegado a los puertos que mejor se miran.
 * Devuelve la misma escena si no se puede o si ya existe ese conector.
 */
export function conectarFormas(escena: Escena, padreId: string, hijaId: string): Escena {
  if (existeConector(escena, padreId, hijaId)) return escena;
  const par = puertosParaConectar(escena, padreId, hijaId);
  const padre = escena.elementos.find((e): e is Forma => e.id === padreId && e.tipo === 'forma');
  const hija = escena.elementos.find((e): e is Forma => e.id === hijaId && e.tipo === 'forma');
  if (!par || !padre || !hija) return escena;
  const r = agregar(escena, {
    tipo: 'linea',
    puntos: [puntoDePuerto(padre, par.origen.puerto), puntoDePuerto(hija, par.destino.puerto)],
    trazado: 'ortogonal',
    inicio: 'ninguno',
    fin: 'flecha',
    origen: par.origen,
    destino: par.destino,
  });
  return r.id === '' ? escena : sincronizarConectores(r.escena);
}
