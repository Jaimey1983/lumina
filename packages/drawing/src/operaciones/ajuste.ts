// ─── Ajuste a cuadrícula y guías (W4) ─────────────────────────────────────────
// Para arrastrar: dado el rectángulo que se está moviendo, calcula cuánto corregirlo para que
// encaje con la cuadrícula o con los bordes y centros de los demás elementos (y de la escena).

import type { Escena, Punto } from '../tipos.js';
import { cajaDeElemento, type Caja } from './geometria.js';
import { expandir, ocultosEfectivos } from './utilidades.js';

export interface Guia {
  orientacion: 'vertical' | 'horizontal';
  /** Coordenada x (vertical) o y (horizontal) de la línea. */
  posicion: number;
  desde: number;
  hasta: number;
}

export interface OpcionesAjuste {
  /** Lado de la cuadrícula; sin esto no hay ajuste a cuadrícula. Encaja siempre a la línea más cercana. */
  cuadricula?: number;
  /** Distancia máxima a la que algo «imanta» (por defecto 6 unidades de escena). */
  umbral?: number;
  /** Ids que se están moviendo (y los hijos de sus grupos): no sirven de referencia. */
  excluir?: Iterable<string>;
  /** Ajustar a los bordes y centros de los demás elementos y de la escena (por defecto sí). */
  guias?: boolean;
}

export interface ResultadoAjuste {
  dx: number;
  dy: number;
  guias: Guia[];
}

const EPS = 0.01;

/** Valores x (izquierda, centro, derecha) o y (arriba, medio, abajo) de una caja. */
const marcasX = (c: Caja): number[] => [c.x, c.x + c.ancho / 2, c.x + c.ancho];
const marcasY = (c: Caja): number[] => [c.y, c.y + c.alto / 2, c.y + c.alto];

function mejorCorreccion(candidatas: readonly number[], objetivos: readonly number[], umbral: number): number | undefined {
  let mejor: number | undefined;
  for (const c of candidatas) {
    for (const o of objetivos) {
      const d = o - c;
      if (Math.abs(d) <= umbral && (mejor === undefined || Math.abs(d) < Math.abs(mejor))) mejor = d;
    }
  }
  return mejor;
}

/** Cuánto hay que correr `caja` (dx, dy) para que encaje, y las guías que hay que mostrar. */
export function ajustarCaja(caja: Caja, escena: Escena, opciones: OpcionesAjuste = {}): ResultadoAjuste {
  const umbral = opciones.umbral ?? 6;
  const usarGuias = opciones.guias !== false;
  const fuera = expandir(escena, opciones.excluir ?? []);
  const ocultos = ocultosEfectivos(escena);

  const referencias: Caja[] = [{ x: 0, y: 0, ancho: escena.ancho, alto: escena.alto }];
  if (usarGuias) {
    for (const e of escena.elementos) {
      if (e.tipo === 'grupo' || fuera.has(e.id) || ocultos.has(e.id)) continue;
      const c = cajaDeElemento(escena, e);
      if (c) referencias.push(c);
    }
  }

  let dx = 0;
  let dy = 0;
  let porGuiaX = false;
  let porGuiaY = false;

  if (usarGuias) {
    const cx = mejorCorreccion(marcasX(caja), referencias.flatMap(marcasX), umbral);
    if (cx !== undefined) {
      dx = cx;
      porGuiaX = true;
    }
    const cy = mejorCorreccion(marcasY(caja), referencias.flatMap(marcasY), umbral);
    if (cy !== undefined) {
      dy = cy;
      porGuiaY = true;
    }
  }

  // La cuadrícula siempre encaja a la línea más cercana (no usa el umbral); una guía tiene prioridad en su eje.
  const g = opciones.cuadricula;
  if (g && g > 0 && Number.isFinite(g)) {
    if (!porGuiaX) dx = Math.round(caja.x / g) * g - caja.x;
    if (!porGuiaY) dy = Math.round(caja.y / g) * g - caja.y;
  }

  const movida: Caja = { ...caja, x: caja.x + dx, y: caja.y + dy };
  const guias: Guia[] = [];
  const vistas = new Set<string>();
  const agregar = (g2: Guia): void => {
    const clave = `${g2.orientacion}:${Math.round(g2.posicion * 100)}`;
    const previa = guias.find((x) => `${x.orientacion}:${Math.round(x.posicion * 100)}` === clave);
    if (previa) {
      previa.desde = Math.min(previa.desde, g2.desde);
      previa.hasta = Math.max(previa.hasta, g2.hasta);
    } else if (!vistas.has(clave)) {
      vistas.add(clave);
      guias.push(g2);
    }
  };
  if (usarGuias) {
    for (const ref of referencias) {
      for (const m of marcasX(movida)) {
        for (const o of marcasX(ref)) {
          if (Math.abs(m - o) < EPS && porGuiaX) {
            agregar({ orientacion: 'vertical', posicion: o, desde: Math.min(movida.y, ref.y), hasta: Math.max(movida.y + movida.alto, ref.y + ref.alto) });
          }
        }
      }
      for (const m of marcasY(movida)) {
        for (const o of marcasY(ref)) {
          if (Math.abs(m - o) < EPS && porGuiaY) {
            agregar({ orientacion: 'horizontal', posicion: o, desde: Math.min(movida.x, ref.x), hasta: Math.max(movida.x + movida.ancho, ref.x + ref.ancho) });
          }
        }
      }
    }
  }
  return { dx, dy, guias };
}

/** Ajusta un punto suelto (por ejemplo el extremo de una línea que se dibuja). */
export function ajustar(punto: Punto, escena: Escena, opciones: OpcionesAjuste = {}): { punto: Punto; guias: Guia[] } {
  const r = ajustarCaja({ x: punto.x, y: punto.y, ancho: 0, alto: 0 }, escena, opciones);
  return { punto: { x: punto.x + r.dx, y: punto.y + r.dy }, guias: r.guias };
}
