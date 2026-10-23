// ─── Ajuste a cuadrícula y guías (W4) ─────────────────────────────────────────
// Para arrastrar: dado el rectángulo que se está moviendo, calcula cuánto corregirlo para que
// encaje con la cuadrícula o con los bordes y centros de los demás elementos (y de la escena).

import type { Escena, Punto } from '../tipos.js';
import { cajaDeElemento, type Caja } from './geometria.js';
import { bloqueadosEfectivos, expandir, ocultosEfectivos } from './utilidades.js';

export interface Guia {
  orientacion: 'vertical' | 'horizontal';
  /** Coordenada x (vertical) o y (horizontal) de la línea. */
  posicion: number;
  desde: number;
  hasta: number;
}

/**
 * Una cota (Y16b): un segmento que mide una distancia. `horizontal` va de `desde` a `hasta` (x) sobre la línea y = `posicion`;
 * `vertical`, de `desde` a `hasta` (y) sobre la línea x = `posicion`. `igual` marca los huecos que quedan iguales (el reparto
 * exacto al que se imantó la forma); las demás son solo la distancia a la vecina más cercana.
 */
export interface Cota {
  orientacion: 'horizontal' | 'vertical';
  desde: number;
  hasta: number;
  posicion: number;
  valor: number;
  igual: boolean;
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
  /**
   * Guías que puso la persona (Y16a): una línea vertical (`posicion` = x) o horizontal (`posicion` = y) de lado a lado.
   * Imantan siempre, aunque `guias` esté apagado (esas son las de los elementos); quien no quiera el imán (Ctrl) no las pasa.
   */
  guiasUsuario?: ReadonlyArray<{ orientacion: 'vertical' | 'horizontal'; posicion: number }>;
  /**
   * Espaciado igual y cotas de distancia (Y16b), solo para una caja con tamaño. Las vecinas son las formas y textos visibles y no
   * bloqueados que se solapan con la caja en el eje cruzado (la misma fila o columna). Las guías de los elementos y las de la
   * persona mandan sobre el reparto; el reparto manda sobre la cuadrícula.
   */
  espaciado?: boolean;
}

// ─── Espaciado igual y cotas (Y16b) ───────────────────────────────────────────

type Eje = 'x' | 'y';

const inicio = (c: Caja, eje: Eje): number => (eje === 'x' ? c.x : c.y);
const tamano = (c: Caja, eje: Eje): number => (eje === 'x' ? c.ancho : c.alto);
const fin = (c: Caja, eje: Eje): number => inicio(c, eje) + tamano(c, eje);
const centro = (c: Caja, eje: Eje): number => inicio(c, eje) + tamano(c, eje) / 2;
const cruzado = (eje: Eje): Eje => (eje === 'x' ? 'y' : 'x');
const seSolapan = (a: Caja, b: Caja, eje: Eje): boolean => Math.min(fin(a, eje), fin(b, eje)) - Math.max(inicio(a, eje), inicio(b, eje)) > EPS;

/** Cómo quedaría repartida una forma: cada tramo es (desde, hasta) en el eje, y `posicion` es la línea en el eje cruzado. */
interface Reparto {
  /** Corrección que lleva la caja al reparto. */
  d: number;
  /** Los huecos que quedan iguales, como pares [desde, hasta] sobre el eje. */
  huecos: Array<[number, number]>;
}

/**
 * El mejor reparto en un eje: entre las dos vecinas más próximas (huecos iguales a los dos lados), o repitiendo el hueco que ya
 * hay entre las dos vecinas más próximas de un mismo lado (tres o más formas en fila). Gana el que pide la corrección más chica
 * dentro del umbral; `null` si ninguno entra. «Más próxima» es por el orden de los centros, que es lo que se ve al arrastrar.
 */
function repartoEnEje(caja: Caja, vecinas: readonly Caja[], eje: Eje, umbral: number): Reparto | null {
  const fila = vecinas.filter((v) => seSolapan(caja, v, cruzado(eje))).sort((a, b) => centro(a, eje) - centro(b, eje));
  if (fila.length === 0) return null;
  const c = centro(caja, eje);
  let i = -1;
  for (let k = 0; k < fila.length; k++) if (centro(fila[k] as Caja, eje) < c) i = k;
  const izq = i >= 0 ? (fila[i] as Caja) : undefined;
  const izqIzq = i >= 1 ? (fila[i - 1] as Caja) : undefined;
  const der = i + 1 < fila.length ? (fila[i + 1] as Caja) : undefined;
  const derDer = i + 2 < fila.length ? (fila[i + 2] as Caja) : undefined;
  const tam = tamano(caja, eje);
  const posibles: Reparto[] = [];
  if (izq && der) {
    const libre = inicio(der, eje) - fin(izq, eje) - tam;
    if (libre >= 0) {
      const x = fin(izq, eje) + libre / 2;
      posibles.push({ d: x - inicio(caja, eje), huecos: [[fin(izq, eje), x], [x + tam, inicio(der, eje)]] });
    }
  }
  if (izq && izqIzq) {
    const hueco = inicio(izq, eje) - fin(izqIzq, eje);
    if (hueco >= 0) {
      const x = fin(izq, eje) + hueco;
      posibles.push({ d: x - inicio(caja, eje), huecos: [[fin(izqIzq, eje), inicio(izq, eje)], [fin(izq, eje), x]] });
    }
  }
  if (der && derDer) {
    const hueco = inicio(derDer, eje) - fin(der, eje);
    if (hueco >= 0) {
      const x = inicio(der, eje) - hueco - tam;
      posibles.push({ d: x - inicio(caja, eje), huecos: [[x + tam, inicio(der, eje)], [fin(der, eje), inicio(derDer, eje)]] });
    }
  }
  let mejor: Reparto | null = null;
  for (const p of posibles) if (Math.abs(p.d) <= umbral && (mejor === null || Math.abs(p.d) < Math.abs(mejor.d))) mejor = p;
  return mejor;
}

/** Cotas de un reparto, dibujadas a la altura (o la columna) del centro de la caja ya movida. */
function cotasDeReparto(r: Reparto, eje: Eje, movida: Caja): Cota[] {
  const linea = centro(movida, cruzado(eje));
  return r.huecos.map(([desde, hasta]) => ({ orientacion: eje === 'x' ? 'horizontal' : 'vertical', desde, hasta, posicion: linea, valor: hasta - desde, igual: true }));
}

/** La distancia a la vecina más cercana de cada lado que está alineada con la caja (se solapan en el otro eje). */
function cotasDeDistancia(movida: Caja, vecinas: readonly Caja[]): Cota[] {
  const cotas: Cota[] = [];
  for (const eje of ['x', 'y'] as const) {
    const alineadas = vecinas.filter((v) => seSolapan(movida, v, cruzado(eje)));
    let antes: Caja | undefined;
    let despues: Caja | undefined;
    for (const v of alineadas) {
      if (fin(v, eje) <= inicio(movida, eje) + EPS && (!antes || fin(v, eje) > fin(antes, eje))) antes = v;
      if (inicio(v, eje) >= fin(movida, eje) - EPS && (!despues || inicio(v, eje) < inicio(despues, eje))) despues = v;
    }
    const linea = centro(movida, cruzado(eje));
    const orientacion = eje === 'x' ? 'horizontal' : 'vertical';
    if (antes) cotas.push({ orientacion, desde: fin(antes, eje), hasta: inicio(movida, eje), posicion: linea, valor: inicio(movida, eje) - fin(antes, eje), igual: false });
    if (despues) cotas.push({ orientacion, desde: fin(movida, eje), hasta: inicio(despues, eje), posicion: linea, valor: inicio(despues, eje) - fin(movida, eje), igual: false });
  }
  return cotas;
}

const mismaCota = (a: Cota, b: Cota): boolean =>
  a.orientacion === b.orientacion && Math.abs(a.desde - b.desde) < EPS && Math.abs(a.hasta - b.hasta) < EPS && Math.abs(a.posicion - b.posicion) < EPS;

export interface ResultadoAjuste {
  dx: number;
  dy: number;
  guias: Guia[];
  /** Cotas de espaciado igual y de distancia a las vecinas (solo con `espaciado`; Y16b). */
  cotas?: Cota[];
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
  const conEspaciado = opciones.espaciado === true && caja.ancho > 0 && caja.alto > 0;
  const bloqueados = conEspaciado ? bloqueadosEfectivos(escena) : null;
  // Las vecinas del espaciado: formas y textos visibles y no bloqueados (los conectores y los bloqueados no cuentan).
  const vecinas: Caja[] = [];
  if (usarGuias || conEspaciado) {
    for (const e of escena.elementos) {
      if (e.tipo === 'grupo' || fuera.has(e.id) || ocultos.has(e.id)) continue;
      const c = cajaDeElemento(escena, e);
      if (!c) continue;
      if (usarGuias) referencias.push(c);
      if (conEspaciado && e.tipo !== 'linea' && !(bloqueados as Set<string>).has(e.id)) vecinas.push(c);
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

  // Las guías de la persona compiten con las de los elementos: gana la más cercana (a igualdad, la de la persona).
  const deUsuario = opciones.guiasUsuario ?? [];
  if (deUsuario.length > 0) {
    const ux = mejorCorreccion(marcasX(caja), deUsuario.filter((u) => u.orientacion === 'vertical').map((u) => u.posicion), umbral);
    if (ux !== undefined && (!porGuiaX || Math.abs(ux) <= Math.abs(dx))) {
      dx = ux;
      porGuiaX = true;
    }
    const uy = mejorCorreccion(marcasY(caja), deUsuario.filter((u) => u.orientacion === 'horizontal').map((u) => u.posicion), umbral);
    if (uy !== undefined && (!porGuiaY || Math.abs(uy) <= Math.abs(dy))) {
      dy = uy;
      porGuiaY = true;
    }
  }

  // El reparto igual (Y16b): solo donde ninguna guía mandó, y manda sobre la cuadrícula.
  let repartoX: Reparto | null = null;
  let repartoY: Reparto | null = null;
  if (conEspaciado) {
    if (!porGuiaX) {
      repartoX = repartoEnEje(caja, vecinas, 'x', umbral);
      if (repartoX) {
        dx = repartoX.d;
        porGuiaX = true;
      }
    }
    if (!porGuiaY) {
      repartoY = repartoEnEje(caja, vecinas, 'y', umbral);
      if (repartoY) {
        dy = repartoY.d;
        porGuiaY = true;
      }
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
  const cotas: Cota[] = [];
  if (conEspaciado) {
    if (repartoX) cotas.push(...cotasDeReparto(repartoX, 'x', movida));
    if (repartoY) cotas.push(...cotasDeReparto(repartoY, 'y', movida));
    for (const c of cotasDeDistancia(movida, vecinas)) if (!cotas.some((k) => mismaCota(k, c))) cotas.push(c);
  }
  return conEspaciado ? { dx, dy, guias, cotas } : { dx, dy, guias };
}

/** Ajusta un punto suelto (por ejemplo el extremo de una línea que se dibuja). */
export function ajustar(punto: Punto, escena: Escena, opciones: OpcionesAjuste = {}): { punto: Punto; guias: Guia[] } {
  const r = ajustarCaja({ x: punto.x, y: punto.y, ancho: 0, alto: 0 }, escena, opciones);
  return { punto: { x: punto.x + r.dx, y: punto.y + r.dy }, guias: r.guias };
}
