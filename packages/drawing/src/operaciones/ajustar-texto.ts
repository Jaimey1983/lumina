// ─── Ajustar la forma al texto (Y24b) ─────────────────────────────────────────
// Puro: calcula el alto que necesita la caja de una forma o de un cuadro de texto para que su texto quepa al tamaño de letra que
// tiene (con la misma estimación que usa el render) y lo aplica. Solo cambia el alto: nunca el ancho ni la letra. La esquina superior
// izquierda se queda donde está (también con giro) y la caja no pisa a las vecinas.

import { sincronizarConectores } from '../conectores/conectar.js';
import { rectanguloTexto } from '../formas/index.js';
import { LIMITES, normalizarEscena } from '../normalizar.js';
import { ajustarComposicion, altoDeTexto } from '../render/texto.js';
import type { Elemento, Escena, Forma, Texto, Transformacion } from '../tipos.js';
import { cajaDePuntos, esquinas, rotarPunto, type Caja } from './geometria.js';
import { conCambios, esConCaja, hojasEditables, ocultosEfectivos, type ElementoConCaja } from './utilidades.js';

/** Alto mínimo al que se encoge una caja (en unidades de escena). */
export const ALTO_MINIMO_AJUSTE = 24;
/** Aire que se deja entre la caja que crece y la vecina que la frena. */
export const MARGEN_VECINAS = 8;
/** Una caja no crece más de este múltiplo de su alto original. */
export const CRECIMIENTO_MAXIMO = 4;
/** Relleno de la zona de texto a cada lado: el mismo que usa el render. */
const RELLENO = 4;

export interface OpcionesAjustarTexto {
  /** Solo crece, nunca encoge (al confirmar una edición). Sin él, el comando explícito crece o encoge. */
  soloCrecer?: boolean;
}

export interface CambioDeAjuste {
  id: string;
  altoAntes: number;
  altoDespues: number;
  /** Crecía más, pero una forma de debajo lo frenó. */
  frenadoPorVecina: boolean;
  /** Aun con el alto nuevo el texto no cabe del todo (el render seguirá reduciendo la letra). */
  noCabe: boolean;
}

export interface ResultadoDeAjuste {
  /** La misma escena si no cambia nada. */
  escena: Escena;
  cambios: CambioDeAjuste[];
}

const tieneTexto = (e: ElementoConCaja): boolean => (e.tipo === 'texto' ? e.texto : (e.texto ?? '')).trim() !== '';

/** La zona donde se escribe el texto cuando la caja mide `alto`: la de la forma (depende de su tipo) o toda la caja de un cuadro de texto. */
function zonaConAlto(e: Forma | Texto, alto: number): { ancho: number; alto: number } {
  if (e.tipo === 'texto') return { ancho: e.transformacion.ancho, alto };
  const z = rectanguloTexto(e.forma, e.transformacion.ancho, alto, { parametros: e.parametros, radio: e.estilo.radio });
  return { ancho: z.ancho, alto: z.alto };
}

/** ¿Cabe el texto, sin reducir la letra, en una caja de este alto? */
function cabeConAlto(e: Forma | Texto, alto: number): boolean {
  const z = zonaConAlto(e, alto);
  const necesita = altoDeTexto(e.tipo === 'texto' ? e.texto : (e.texto ?? ''), Math.max(1, z.ancho - 2 * RELLENO), e.estiloTexto);
  return necesita <= z.alto - 2 * RELLENO;
}

/** La transformación con otro alto y **la esquina superior izquierda fija en la escena**, aunque la caja esté girada. */
function conAlto(t: Transformacion, alto: number): Transformacion {
  const c = { x: t.x + t.ancho / 2, y: t.y + t.alto / 2 };
  const arriba = rotarPunto({ x: c.x, y: c.y - t.alto / 2 }, c, t.rotacion);
  const v = rotarPunto({ x: 0, y: alto / 2 }, { x: 0, y: 0 }, t.rotacion);
  const centro = { x: arriba.x + v.x, y: arriba.y + v.y };
  return { ...t, x: centro.x - t.ancho / 2, y: centro.y - alto / 2, alto };
}

const cajaDe = (t: Transformacion): Caja => cajaDePuntos(esquinas(t)) as Caja;

const solapan = (a: Caja, b: Caja, margen = 0): boolean => a.x < b.x + b.ancho + margen && a.x + a.ancho + margen > b.x && a.y < b.y + b.alto + margen && a.y + a.alto + margen > b.y;

/** El menor alto entero en `[desde, hasta]` que cumple `cabe` (`desde` si ya cabe, `hasta` si ni así cabe). */
function menorAlto(desde: number, hasta: number, cabe: (alto: number) => boolean): number {
  if (cabe(desde)) return desde;
  if (!cabe(hasta)) return hasta;
  let lo = desde;
  let hi = hasta;
  while (hi - lo > 1) {
    const medio = (lo + hi) / 2;
    if (cabe(medio)) hi = medio;
    else lo = medio;
  }
  for (let h = Math.ceil(lo); h <= Math.ceil(hi); h++) if (h <= hasta && cabe(h)) return h;
  return hasta;
}

/** El mayor alto entero en `[t.alto, deseado]` con el que la caja no pisa a ninguna de las `vecinas` (`t.alto` si ni uno entero cabe). */
function mayorAltoLibre(t: Transformacion, deseado: number, vecinas: readonly Caja[]): number {
  const choca = (alto: number): boolean => {
    const caja = cajaDe(conAlto(t, alto));
    return vecinas.some((v) => solapan(caja, v, MARGEN_VECINAS));
  };
  if (!choca(deseado)) return deseado;
  let lo = t.alto;
  let hi = deseado;
  while (hi - lo > 1) {
    const medio = (lo + hi) / 2;
    if (choca(medio)) hi = medio;
    else lo = medio;
  }
  for (let h = Math.floor(hi); h > lo; h--) if (!choca(h)) return h;
  return lo;
}

/**
 * Deja a cada forma o texto con texto, entre los elegidos (también dentro de grupos), con el alto justo para que su texto quepa.
 * `soloCrecer` no encoge nunca; el mínimo es `ALTO_MINIMO_AJUSTE` y el máximo, cuatro veces el alto original. Una caja que crecería sobre
 * una forma visible de debajo se detiene antes de pisarla (con `MARGEN_VECINAS`). Lo bloqueado no cambia, los conectores pegados siguen
 * a su forma y lo demás no se toca. Devuelve la misma escena si no cambia nada.
 */
export function ajustarAlTexto(escena: Escena, ids: Iterable<string>, opciones: OpcionesAjustarTexto = {}): ResultadoDeAjuste {
  const objetivos = hojasEditables(escena, ids).filter((h): h is ElementoConCaja => esConCaja(h) && tieneTexto(h));
  if (objetivos.length === 0) return { escena, cambios: [] };
  const cambios: CambioDeAjuste[] = [];
  const cambiados = new Map<string, Elemento>();
  const ocultos = ocultosEfectivos(escena);
  const transformaciones = new Map<string, Transformacion>(escena.elementos.filter(esConCaja).map((e) => [e.id, e.transformacion]));
  // Las cajas de lo que se ve, calculadas una vez (se actualiza la de cada elemento que cambia): son las posibles vecinas.
  const cajas = new Map<string, Caja>();
  for (const e of escena.elementos) if (esConCaja(e) && !ocultos.has(e.id)) cajas.set(e.id, cajaDe(e.transformacion));

  for (const e of objetivos) {
    const t = transformaciones.get(e.id) as Transformacion;
    const tope = Math.min(e.transformacion.alto * CRECIMIENTO_MAXIMO, LIMITES.medida.max);
    const desde = opciones.soloCrecer ? t.alto : ALTO_MINIMO_AJUSTE;
    const viva = { ...e, transformacion: t } as Forma | Texto;
    let alto = menorAlto(desde, Math.max(tope, desde), (h) => cabeConAlto(viva, h));
    let frenado = false;
    if (alto > t.alto) {
      const actual = cajas.get(e.id) ?? cajaDe(t);
      const maxima = cajaDe(conAlto(t, alto));
      // Solo importan las que caen en el hueco que la caja ocuparía al crecer del todo y que no la pisan ya.
      const vecinas: Caja[] = [];
      for (const [id, caja] of cajas) if (id !== e.id && solapan(maxima, caja, MARGEN_VECINAS) && !solapan(actual, caja)) vecinas.push(caja);
      const libre = mayorAltoLibre(t, alto, vecinas);
      frenado = libre < alto;
      alto = libre;
    }
    if (Math.abs(alto - t.alto) < 1e-9) continue;
    const nueva = conAlto(t, alto);
    transformaciones.set(e.id, nueva);
    if (cajas.has(e.id)) cajas.set(e.id, cajaDe(nueva));
    cambiados.set(e.id, { ...e, transformacion: nueva } as Elemento);
    cambios.push({ id: e.id, altoAntes: t.alto, altoDespues: alto, frenadoPorVecina: frenado, noCabe: !cabeConAlto({ ...e, transformacion: nueva } as Forma | Texto, alto) });
  }
  if (cambiados.size === 0) return { escena, cambios: [] };
  return { escena: normalizarEscena(sincronizarConectores(conCambios(escena, cambiados))), cambios };
}

/** Lo que el render hace con el texto de una forma o de un cuadro de texto: nada, reducir la letra o salirse por abajo. */
export type EstadoDelTexto = { tipo: 'cabe' } | { tipo: 'reduce'; tamano: number } | { tipo: 'sale' };

export function estadoDelTexto(e: Forma | Texto): EstadoDelTexto {
  const texto = e.tipo === 'texto' ? e.texto : (e.texto ?? '');
  if (texto.trim() === '') return { tipo: 'cabe' };
  if (e.tipo === 'texto') return cabeConAlto(e, e.transformacion.alto) ? { tipo: 'cabe' } : { tipo: 'sale' };
  const z = zonaConAlto(e, e.transformacion.alto);
  const ajustado = ajustarComposicion(texto, Math.max(1, z.ancho - 2 * RELLENO), Math.max(1, z.alto - 2 * RELLENO), e.estiloTexto.tamano, e.estiloTexto.negrita, e.estiloTexto.vinetas);
  return ajustado.tamano < e.estiloTexto.tamano ? { tipo: 'reduce', tamano: ajustado.tamano } : { tipo: 'cabe' };
}
