// ─── Render de la escena a SVG (W3) ───────────────────────────────────────────
// Función pura: `Escena` → árbol de nodos SVG (`NodoSvg`). De ese árbol salen el
// componente de pantalla (React, sin `innerHTML`) y el archivo exportable (string),
// así que ambos dibujan exactamente lo mismo.

import { formasVisibles, puntoDePuerto } from '../conectores/puertos.js';
import { formasConHijos, resumenDeColapso } from '../operaciones/colapso.js';
import { cajaDeForma, cajasDeFormas, trazarLinea, type CajaObstaculo } from '../conectores/trazado.js';
import { FORMAS, rectanguloTexto, trazadoForma } from '../formas/index.js';
import type { Elemento, Escena, Estilo, EstiloTexto, Extremo, Forma, Linea, Punto, Relleno, Sombra, Texto } from '../tipos.js';
import { resolverColor, type ModoColor, type Pintura } from './colores.js';
import { ajustarComposicion, componerTexto, INTERLINEADO } from './texto.js';

export interface NodoSvg {
  tag: string;
  attrs: Record<string, string | number>;
  hijos?: NodoSvg[];
  /** Contenido de texto (se escapa al serializar). */
  texto?: string;
}

export interface OpcionesRender {
  /** `css` deja los tokens `var(--x)` (sigue al tema de la app); `claro`/`oscuro` los resuelven a hex. */
  modo?: ModoColor;
  /** `false` omite el fondo de la escena (PNG/SVG con fondo transparente). */
  fondo?: boolean;
  /** Prefijo de los ids internos (degradados, sombras): debe ser único si hay varias escenas en la misma página. */
  prefijoIds?: string;
  /**
   * Marcadores de las ramas (Y38a, DY75): `colapsados` (por defecto) dibuja un «+N» en cada forma plegada; `todos`, además, un «−» en las
   * desplegadas que tienen hijos (para el editor y el visor, donde se pueden tocar); `ninguno` no dibuja marcadores.
   */
  indicadoresRama?: 'colapsados' | 'todos' | 'ninguno';
}

export interface EscenaNodos {
  ancho: number;
  alto: number;
  nodos: NodoSvg[];
}

interface Contexto {
  modo: ModoColor;
  prefijo: string;
  defs: NodoSvg[];
  siguienteId: number;
  formas: Map<string, Forma>;
  /** Formas visibles: los conectores en ángulo recto las rodean. */
  obstaculos: CajaObstaculo[];
  fondoEscena: string;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

const r = (v: number): number => Math.round(v * 100) / 100;

function nodo(tag: string, attrs: NodoSvg['attrs'] = {}, hijos?: NodoSvg[], texto?: string): NodoSvg {
  return { tag, attrs, ...(hijos && hijos.length > 0 ? { hijos } : {}), ...(texto !== undefined ? { texto } : {}) };
}

function idNuevo(ctx: Contexto, clase: string): string {
  ctx.siguienteId += 1;
  return `${ctx.prefijo}-${clase}-${ctx.siguienteId}`;
}

/** `fill` / `stroke` / `stop-color` con su opacidad (si el color trae alfa). */
function pintar(color: string, ctx: Contexto, prefijo: 'fill' | 'stroke'): NodoSvg['attrs'] {
  const p = resolverColor(color, ctx.modo);
  return { [prefijo]: p.color, ...(p.opacidad < 1 ? { [`${prefijo}-opacity`]: p.opacidad } : {}) };
}

function transformacion(x: number, y: number, ancho: number, alto: number, rotacion: number): string {
  const mover = `translate(${r(x)} ${r(y)})`;
  return rotacion === 0 ? mover : `${mover} rotate(${r(rotacion)} ${r(ancho / 2)} ${r(alto / 2)})`;
}

/** Posición en la escena del puerto `puerto` de una forma (con su rotación). */
export { puntoDePuerto };

// ─── Relleno, contorno, sombra ────────────────────────────────────────────────

/**
 * Sombra interior (Y23): el alfa de la forma (contorno incluido) se invierte, se difumina y se desplaza; con él se recorta
 * el color de la sombra, que se compone **encima** del dibujo y solo dentro de la forma.
 */
function filtroInterior(s: Sombra, p: Pintura): NodoSvg[] {
  return [
    nodo('feComponentTransfer', { in: 'SourceAlpha', result: 'invertida' }, [nodo('feFuncA', { type: 'table', tableValues: '1 0' })]),
    nodo('feGaussianBlur', { in: 'invertida', stdDeviation: r(s.desenfoque / 2), result: 'difusa' }),
    nodo('feOffset', { in: 'difusa', dx: s.dx, dy: s.dy, result: 'desplazada' }),
    nodo('feFlood', { 'flood-color': p.color, 'flood-opacity': p.opacidad, result: 'color' }),
    nodo('feComposite', { in: 'color', in2: 'desplazada', operator: 'in', result: 'sombra' }),
    nodo('feComposite', { in: 'sombra', in2: 'SourceAlpha', operator: 'in', result: 'interior' }),
    nodo('feMerge', {}, [nodo('feMergeNode', { in: 'SourceGraphic' }), nodo('feMergeNode', { in: 'interior' })]),
  ];
}

/**
 * Un `<pattern>` con el azulejo del relleno (Y23). Va en unidades de escena (`userSpaceOnUse`) y dentro del mismo `transform`
 * que la forma: gira y se mueve con ella y no cambia de tamaño con el zoom.
 */
function nodoPatron(rel: Extract<Relleno, { tipo: 'patron' }>, id: string, ctx: Contexto): NodoSvg {
  const e = rel.escala;
  const tinta = (grosor: number): NodoSvg['attrs'] => ({ ...pintar(rel.color, ctx, 'stroke'), 'stroke-width': r(grosor), fill: 'none' });
  const hijos: NodoSvg[] = [];
  if (rel.fondo !== null) hijos.push(nodo('rect', { width: e, height: e, ...pintar(rel.fondo, ctx, 'fill') }));
  if (rel.patron === 'rayas') {
    hijos.push(nodo('rect', { x: 0, y: r(e * 0.375), width: e, height: r(e / 4), ...pintar(rel.color, ctx, 'fill') }));
  } else if (rel.patron === 'diagonal') {
    // Tres segmentos para que las diagonales se junten sin cortes entre azulejos vecinos.
    hijos.push(nodo('path', { d: `M${r(-e / 2)} ${r(e / 2)}L${r(e / 2)} ${r(-e / 2)}M0 ${e}L${e} 0M${r(e / 2)} ${r(e * 1.5)}L${r(e * 1.5)} ${r(e / 2)}`, ...tinta(e / 4) }));
  } else if (rel.patron === 'cuadricula') {
    hijos.push(nodo('path', { d: `M0 ${r(e / 2)}L${e} ${r(e / 2)}M${r(e / 2)} 0L${r(e / 2)} ${e}`, ...tinta(e / 8) }));
  } else {
    hijos.push(nodo('circle', { cx: r(e / 2), cy: r(e / 2), r: r(e / 6), ...pintar(rel.color, ctx, 'fill') }));
  }
  return nodo('pattern', { id, patternUnits: 'userSpaceOnUse', width: e, height: e }, hijos);
}

function atributosEstilo(estilo: Estilo, ctx: Contexto, tieneRelleno: boolean): NodoSvg['attrs'] {
  const attrs: NodoSvg['attrs'] = {};

  const rel = estilo.relleno;
  if (!tieneRelleno || rel.tipo === 'ninguno') {
    attrs.fill = 'none';
  } else if (rel.tipo === 'solido') {
    Object.assign(attrs, pintar(rel.color, ctx, 'fill'));
  } else if (rel.tipo === 'degradado') {
    const id = idNuevo(ctx, 'degradado');
    // Ningún degradado aplica el alfa de sus colores (DY32): las escenas guardadas antes dependen de ello.
    const parada = (offset: number, color: string): NodoSvg => nodo('stop', { offset, 'stop-color': resolverColor(color, ctx.modo).color });
    const paradas = [parada(0, rel.desde), ...(rel.paradas ?? []).map((p) => parada(p.posicion, p.color)), parada(1, rel.hasta)];
    if (rel.forma === 'radial') {
      ctx.defs.push(nodo('radialGradient', { id, cx: 0.5, cy: 0.5, r: 0.5 }, paradas));
    } else {
      const a = (rel.angulo * Math.PI) / 180;
      const dx = Math.cos(a) / 2;
      const dy = Math.sin(a) / 2;
      ctx.defs.push(nodo('linearGradient', { id, x1: r(0.5 - dx), y1: r(0.5 - dy), x2: r(0.5 + dx), y2: r(0.5 + dy) }, paradas));
    }
    attrs.fill = `url(#${id})`;
  } else {
    const id = idNuevo(ctx, 'patron');
    ctx.defs.push(nodoPatron(rel, id, ctx));
    attrs.fill = `url(#${id})`;
  }

  const c = estilo.contorno;
  if (c.grosor > 0) {
    Object.assign(attrs, pintar(c.color, ctx, 'stroke'));
    attrs['stroke-width'] = c.grosor;
    attrs['stroke-linejoin'] = 'round';
    if (c.patron === 'guiones') attrs['stroke-dasharray'] = `${r(c.grosor * 3)} ${r(c.grosor * 2)}`;
    if (c.patron === 'puntos') {
      attrs['stroke-dasharray'] = `0.01 ${r(c.grosor * 2.2)}`;
      attrs['stroke-linecap'] = 'round';
    }
  } else {
    attrs.stroke = 'none';
  }

  if (estilo.sombra) {
    const s = estilo.sombra;
    const id = idNuevo(ctx, 'sombra');
    const p = resolverColor(s.color, ctx.modo);
    ctx.defs.push(
      nodo('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, s.interior ? filtroInterior(s, p) : [
        nodo('feDropShadow', { dx: s.dx, dy: s.dy, stdDeviation: r(s.desenfoque / 2), 'flood-color': p.color, 'flood-opacity': p.opacidad }),
      ]),
    );
    attrs.filter = `url(#${id})`;
  }

  return attrs;
}

// ─── Texto ────────────────────────────────────────────────────────────────────

function nodosTexto(
  texto: string,
  zona: { x: number; y: number; ancho: number; alto: number },
  et: EstiloTexto,
  ctx: Contexto,
  autoajustar = false,
  conLista = false,
): NodoSvg[] {
  const relleno = 4;
  const anchoUtil = Math.max(1, zona.ancho - 2 * relleno);
  // La lista solo la llevan las formas y los cuadros de texto; el rótulo de un conector la ignora (Y24a).
  const vinetas = conLista ? et.vinetas : undefined;
  const ajustado = autoajustar
    ? ajustarComposicion(texto, anchoUtil, Math.max(1, zona.alto - 2 * relleno), et.tamano, et.negrita, vinetas)
    : { tamano: et.tamano, ...componerTexto(texto, anchoUtil, et.tamano, et.negrita, vinetas, false) };
  const { lineas, sangria } = ajustado;
  const tamano = ajustado.tamano;
  const altoLinea = tamano * INTERLINEADO;
  const total = lineas.length * altoLinea;
  const arriba =
    et.alineacionV === 'arriba' ? zona.y + relleno : et.alineacionV === 'abajo' ? zona.y + zona.alto - relleno - total : zona.y + (zona.alto - total) / 2;
  // Con lista el texto va a la izquierda, a la derecha de la sangría; la alineación elegida se conserva en el modelo pero no se usa.
  const [x, ancla] = vinetas
    ? [zona.x + relleno + sangria, 'start']
    : et.alineacionH === 'izquierda'
      ? [zona.x + relleno, 'start']
      : et.alineacionH === 'derecha'
        ? [zona.x + zona.ancho - relleno, 'end']
        : [zona.x + zona.ancho / 2, 'middle'];

  const comunes: NodoSvg['attrs'] = {
    'font-size': tamano,
    'font-weight': et.negrita ? 700 : 400,
    'text-anchor': ancla,
    ...pintar(et.color, ctx, 'fill'),
    ...(et.cursiva ? { 'font-style': 'italic' } : {}),
    ...(et.subrayado ? { 'text-decoration': 'underline' } : {}),
    ...(et.fuente ? { 'font-family': et.fuente } : {}),
  };

  // La marca de una lista va en el borde izquierdo y no se subraya: el subrayado cubre solo el texto.
  const deMarca: NodoSvg['attrs'] = { ...Object.fromEntries(Object.entries(comunes).filter(([k]) => k !== 'text-decoration')), 'text-anchor': 'start', 'aria-hidden': 'true' };

  const salida: NodoSvg[] = [];
  lineas.forEach((linea, i) => {
    const y = r(arriba + i * altoLinea + tamano);
    if (linea.marca) salida.push(nodo('text', { x: r(zona.x + relleno), y, ...deMarca }, undefined, linea.marca));
    if (linea.texto === '') return;
    salida.push(nodo('text', { x: r(x), y, ...comunes }, undefined, linea.texto));
  });
  return salida;
}

// ─── Elementos ────────────────────────────────────────────────────────────────

function etiquetaAccesible(e: Elemento): string | undefined {
  return e.descripcion ?? e.nombre;
}

function nodoForma(f: Forma, ctx: Contexto): NodoSvg {
  const t = f.transformacion;
  const hijos: NodoSvg[] = [];
  const titulo = etiquetaAccesible(f);
  if (titulo) hijos.push(nodo('title', {}, undefined, titulo));
  // Los iconos (Y32a) se dibujan con extremos redondeados, como en la librería de origen; las demás formas, igual que siempre.
  const extremos: NodoSvg['attrs'] = FORMAS[f.forma].grupo === 'iconos' ? { 'stroke-linecap': 'round' } : {};
  hijos.push(nodo('path', { d: trazadoForma(f.forma, t.ancho, t.alto, { parametros: f.parametros, radio: f.estilo.radio }), ...atributosEstilo(f.estilo, ctx, true), ...extremos }));
  if (f.texto) {
    hijos.push(...nodosTexto(f.texto, rectanguloTexto(f.forma, t.ancho, t.alto, { parametros: f.parametros }), f.estiloTexto, ctx, true, true));
  }
  return nodo('g', { 'data-elemento-id': f.id, transform: transformacion(t.x, t.y, t.ancho, t.alto, t.rotacion), ...(f.estilo.opacidad < 1 ? { opacity: f.estilo.opacidad } : {}) }, hijos);
}

function nodoTexto(e: Texto, ctx: Contexto): NodoSvg {
  const t = e.transformacion;
  const hijos: NodoSvg[] = [];
  const titulo = etiquetaAccesible(e);
  if (titulo) hijos.push(nodo('title', {}, undefined, titulo));
  const tieneCaja = e.estilo.relleno.tipo !== 'ninguno' || e.estilo.contorno.grosor > 0;
  if (tieneCaja) {
    hijos.push(nodo('rect', { x: 0, y: 0, width: t.ancho, height: t.alto, rx: e.estilo.radio, ...atributosEstilo(e.estilo, ctx, true) }));
  }
  hijos.push(...nodosTexto(e.texto, { x: 0, y: 0, ancho: t.ancho, alto: t.alto }, e.estiloTexto, ctx, false, true));
  return nodo('g', { 'data-elemento-id': e.id, transform: transformacion(t.x, t.y, t.ancho, t.alto, t.rotacion), ...(e.estilo.opacidad < 1 ? { opacity: e.estilo.opacidad } : {}) }, hijos);
}

// ─── Líneas ───────────────────────────────────────────────────────────────────

const fp = (p: Punto): string => `${r(p.x)},${r(p.y)}`;

function extremoSvg(tipo: Extremo, punta: Punto, desde: Punto, grosor: number, color: string, ctx: Contexto): NodoSvg | undefined {
  if (tipo === 'ninguno') return undefined;
  const dx = punta.x - desde.x;
  const dy = punta.y - desde.y;
  const largo = Math.hypot(dx, dy) || 1;
  const ux = dx / largo;
  const uy = dy / largo;
  const px = -uy;
  const py = ux;
  const tam = 8 + grosor * 2;
  const mitad = 4 + grosor;
  const relleno = pintar(color, ctx, 'fill');
  const trazo = pintar(color, ctx, 'stroke');

  if (tipo === 'flecha') {
    const base = { x: punta.x - ux * tam, y: punta.y - uy * tam };
    const puntos = [punta, { x: base.x + px * mitad, y: base.y + py * mitad }, { x: base.x - px * mitad, y: base.y - py * mitad }];
    return nodo('polygon', { points: puntos.map(fp).join(' '), ...relleno });
  }
  if (tipo === 'flecha-abierta') {
    const base = { x: punta.x - ux * tam, y: punta.y - uy * tam };
    const a = { x: base.x + px * mitad, y: base.y + py * mitad };
    const b = { x: base.x - px * mitad, y: base.y - py * mitad };
    return nodo('path', { d: `M${fp(a)} L${fp(punta)} L${fp(b)}`, fill: 'none', ...trazo, 'stroke-width': grosor, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }
  if (tipo === 'circulo') {
    const radio = 3 + grosor;
    return nodo('circle', { cx: r(punta.x - ux * radio), cy: r(punta.y - uy * radio), r: radio, ...relleno });
  }
  // rombo
  const centro = { x: punta.x - (ux * tam) / 2, y: punta.y - (uy * tam) / 2 };
  const puntos = [punta, { x: centro.x + px * mitad, y: centro.y + py * mitad }, { x: punta.x - ux * tam, y: punta.y - uy * tam }, { x: centro.x - px * mitad, y: centro.y - py * mitad }];
  return nodo('polygon', { points: puntos.map(fp).join(' '), ...relleno });
}

function nodoLinea(l: Linea, ctx: Contexto): NodoSvg {
  const { d, ruta, medio: centro } = trazarLinea(l, ctx.formas, ctx.obstaculos);
  const c = l.estilo.contorno;
  const grosor = Math.max(c.grosor, 1);
  const hijos: NodoSvg[] = [];
  const titulo = etiquetaAccesible(l);
  if (titulo) hijos.push(nodo('title', {}, undefined, titulo));

  hijos.push(nodo('path', { d, ...atributosEstilo({ ...l.estilo, relleno: { tipo: 'ninguno' }, contorno: { ...c, grosor } }, ctx, false), 'stroke-linecap': 'round' }));

  const inicio = extremoSvg(l.inicio, ruta[0], ruta[1] ?? ruta[0], grosor, c.color, ctx);
  const fin = extremoSvg(l.fin, ruta[ruta.length - 1], ruta[ruta.length - 2] ?? ruta[ruta.length - 1], grosor, c.color, ctx);
  if (inicio) hijos.push(inicio);
  if (fin) hijos.push(fin);

  if (l.texto) {
    const ancho = Math.max(24, l.texto.length * l.estiloTexto.tamano * 0.55 + 14);
    const alto = l.estiloTexto.tamano * 1.5;
    hijos.push(
      nodo('rect', { x: r(centro.x - ancho / 2), y: r(centro.y - alto / 2), width: r(ancho), height: r(alto), rx: r(alto / 2), ...pintar(ctx.fondoEscena, ctx, 'fill'), stroke: 'none' }),
      ...nodosTexto(l.texto, { x: centro.x - ancho / 2, y: centro.y - alto / 2, ancho, alto }, { ...l.estiloTexto, alineacionH: 'centro', alineacionV: 'medio' }, ctx, true),
    );
  }

  return nodo('g', { 'data-elemento-id': l.id, ...(l.estilo.opacidad < 1 ? { opacity: l.estilo.opacidad } : {}) }, hijos);
}

// ─── Marcadores de rama (Y38a) ────────────────────────────────────────────────

const RADIO_MARCADOR = 11;

/** Texto del marcador de una rama plegada: «+N» y, desde 100 formas ocultas, «99+». */
export function textoDeMarcador(ocultas: number): string {
  return ocultas >= 100 ? '99+' : `+${ocultas}`;
}

/**
 * El marcador de una rama: un círculo en la esquina inferior derecha de la caja que envuelve a la forma, con «+N» (plegada) o «−» (desplegada
 * y con hijos). `data-colapsar-id` lo identifica para quien lo toque (el editor y el visor); en un archivo exportado es solo un dibujo.
 */
function nodoMarcador(f: Forma, plegada: boolean, ocultas: number, ctx: Contexto): NodoSvg {
  const caja = cajaDeForma(f);
  const cx = r(caja.x + caja.ancho);
  const cy = r(caja.y + caja.alto);
  const texto = plegada ? textoDeMarcador(ocultas) : '−';
  const primera = f.texto?.trim().split('\n')[0];
  const nombre = primera ? ` «${primera}»` : '';
  const etiqueta = plegada
    ? `Rama plegada${nombre}: ${ocultas} ${ocultas === 1 ? 'elemento oculto' : 'elementos ocultos'}. Desplegar`
    : `Plegar la rama${nombre}`;
  return nodo('g', { 'data-colapsar-id': f.id, role: 'button', 'aria-label': etiqueta }, [
    nodo('circle', { cx, cy, r: RADIO_MARCADOR, ...pintar('var(--card)', ctx, 'fill'), ...pintar('var(--border)', ctx, 'stroke'), 'stroke-width': 1.5 }),
    nodo('text', { x: cx, y: r(cy + 4), 'text-anchor': 'middle', 'font-size': texto.length > 2 ? 9 : 11, 'font-weight': 600, ...pintar('var(--foreground)', ctx, 'fill'), 'pointer-events': 'none' }, undefined, texto),
  ]);
}

// ─── Escena ───────────────────────────────────────────────────────────────────

/** Ids de los elementos ocultos, incluidos los hijos de un grupo oculto (y, aparte, lo plegado: ver `resumenDeColapso`). */
function idsOcultos(elementos: readonly Elemento[]): Set<string> {
  const ocultos = new Set<string>();
  const porId = new Map(elementos.map((e) => [e.id, e]));
  const ocultar = (id: string): void => {
    if (ocultos.has(id)) return;
    ocultos.add(id);
    const e = porId.get(id);
    if (e?.tipo === 'grupo') e.hijos.forEach(ocultar);
  };
  for (const e of elementos) if (e.oculto) ocultar(e.id);
  return ocultos;
}

export function escenaANodos(escena: Escena, opciones: OpcionesRender = {}): EscenaNodos {
  const ctx: Contexto = {
    modo: opciones.modo ?? 'css',
    prefijo: (opciones.prefijoIds ?? 'dibujo').replace(/[^A-Za-z0-9_-]/g, '') || 'dibujo',
    defs: [],
    siguienteId: 0,
    formas: new Map(escena.elementos.filter((e): e is Forma => e.tipo === 'forma').map((f) => [f.id, f])),
    obstaculos: cajasDeFormas(formasVisibles(escena)),
    fondoEscena: escena.fondo ?? 'var(--background)',
  };
  const ocultos = idsOcultos(escena.elementos);
  const colapso = resumenDeColapso(escena);
  for (const id of colapso.ocultos) ocultos.add(id); // lo plegado (Y38a) tampoco se dibuja

  const elementos: NodoSvg[] = [];
  for (const e of escena.elementos) {
    if (ocultos.has(e.id)) continue;
    if (e.tipo === 'forma') elementos.push(nodoForma(e, ctx));
    else if (e.tipo === 'texto') elementos.push(nodoTexto(e, ctx));
    else if (e.tipo === 'linea') elementos.push(nodoLinea(e, ctx));
    // Un grupo no se dibuja: lo dibujan sus hijos.
  }

  // Marcadores de las ramas, encima de todo: «+N» en las plegadas y, en las vistas que se pueden tocar, «−» en las que tienen hijos.
  const modoMarcadores = opciones.indicadoresRama ?? 'colapsados';
  if (modoMarcadores !== 'ninguno') {
    const conHijos = modoMarcadores === 'todos' ? formasConHijos(escena) : null;
    for (const e of escena.elementos) {
      if (e.tipo !== 'forma' || ocultos.has(e.id)) continue;
      const ocultas = colapso.cuentas.get(e.id) ?? 0;
      if (e.colapsado === true && ocultas > 0) elementos.push(nodoMarcador(e, true, ocultas, ctx));
      else if (conHijos && e.colapsado !== true && conHijos.has(e.id)) elementos.push(nodoMarcador(e, false, 0, ctx));
    }
  }

  const nodos: NodoSvg[] = [];
  if (ctx.defs.length > 0) nodos.push(nodo('defs', {}, ctx.defs));
  if (escena.fondo !== null && opciones.fondo !== false) {
    nodos.push(nodo('rect', { width: escena.ancho, height: escena.alto, ...pintar(escena.fondo, ctx, 'fill') }));
  }
  nodos.push(...elementos);
  return { ancho: escena.ancho, alto: escena.alto, nodos };
}

// ─── Serialización ────────────────────────────────────────────────────────────

export function escaparXml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function serializarNodo(n: NodoSvg): string {
  const attrs = Object.entries(n.attrs)
    .map(([k, v]) => ` ${k}="${escaparXml(String(v))}"`)
    .join('');
  const interior = (n.texto !== undefined ? escaparXml(n.texto) : '') + (n.hijos ?? []).map(serializarNodo).join('');
  return interior === '' ? `<${n.tag}${attrs}/>` : `<${n.tag}${attrs}>${interior}</${n.tag}>`;
}

export interface OpcionesSvg extends OpcionesRender {
  titulo?: string;
  descripcion?: string;
}

/** Documento SVG autónomo (para exportar). Con `modo: 'css'` conserva los tokens, que fuera de la app no resuelven: usar `claro` u `oscuro`. */
export function escenaASvg(escena: Escena, opciones: OpcionesSvg = {}): { svg: string; ancho: number; alto: number } {
  const { ancho, alto, nodos } = escenaANodos(escena, opciones);
  const hijos: NodoSvg[] = [];
  hijos.push(nodo('title', {}, undefined, opciones.titulo?.trim() || 'Dibujo'));
  if (opciones.descripcion?.trim()) hijos.push(nodo('desc', {}, undefined, opciones.descripcion.trim()));
  hijos.push(...nodos);
  const raiz = nodo(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: ancho,
      height: alto,
      viewBox: `0 0 ${ancho} ${alto}`,
      role: 'img',
      ...((opciones.modo ?? 'css') === 'css' ? {} : { 'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }),
    },
    hijos,
  );
  return { svg: serializarNodo(raiz), ancho, alto };
}
