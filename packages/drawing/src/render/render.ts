// ─── Render de la escena a SVG (W3) ───────────────────────────────────────────
// Función pura: `Escena` → árbol de nodos SVG (`NodoSvg`). De ese árbol salen el
// componente de pantalla (React, sin `innerHTML`) y el archivo exportable (string),
// así que ambos dibujan exactamente lo mismo.

import { puertosForma, rectanguloTexto, trazadoForma } from '../formas/index.js';
import type { Elemento, Escena, Estilo, EstiloTexto, Extremo, Forma, Linea, Punto, Texto } from '../tipos.js';
import { resolverColor, type ModoColor } from './colores.js';
import { ajustarTexto, INTERLINEADO, lineasDeTexto } from './texto.js';

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

function rotarPunto(p: Punto, centro: Punto, grados: number): Punto {
  if (grados === 0) return p;
  const a = (grados * Math.PI) / 180;
  const dx = p.x - centro.x;
  const dy = p.y - centro.y;
  return { x: centro.x + dx * Math.cos(a) - dy * Math.sin(a), y: centro.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** Posición en la escena del puerto `puerto` de una forma (con su rotación). */
export function puntoDePuerto(forma: Forma, puerto: number): Punto {
  const t = forma.transformacion;
  const opciones = { parametros: forma.parametros, radio: forma.estilo.radio };
  const puertos = puertosForma(forma.forma, t.ancho, t.alto, opciones);
  const local = puertos[puerto] ?? puertos[0] ?? { x: t.ancho / 2, y: t.alto / 2 };
  const rotado = rotarPunto(local, { x: t.ancho / 2, y: t.alto / 2 }, t.rotacion);
  return { x: t.x + rotado.x, y: t.y + rotado.y };
}

// ─── Relleno, contorno, sombra ────────────────────────────────────────────────

function atributosEstilo(estilo: Estilo, ctx: Contexto, tieneRelleno: boolean): NodoSvg['attrs'] {
  const attrs: NodoSvg['attrs'] = {};

  const rel = estilo.relleno;
  if (!tieneRelleno || rel.tipo === 'ninguno') {
    attrs.fill = 'none';
  } else if (rel.tipo === 'solido') {
    Object.assign(attrs, pintar(rel.color, ctx, 'fill'));
  } else {
    const id = idNuevo(ctx, 'degradado');
    const a = (rel.angulo * Math.PI) / 180;
    const dx = Math.cos(a) / 2;
    const dy = Math.sin(a) / 2;
    ctx.defs.push(
      nodo('linearGradient', { id, x1: r(0.5 - dx), y1: r(0.5 - dy), x2: r(0.5 + dx), y2: r(0.5 + dy) }, [
        nodo('stop', { offset: 0, 'stop-color': resolverColor(rel.desde, ctx.modo).color }),
        nodo('stop', { offset: 1, 'stop-color': resolverColor(rel.hasta, ctx.modo).color }),
      ]),
    );
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
      nodo('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, [
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
): NodoSvg[] {
  const relleno = 4;
  const anchoUtil = Math.max(1, zona.ancho - 2 * relleno);
  const ajustado = autoajustar
    ? ajustarTexto(texto, anchoUtil, Math.max(1, zona.alto - 2 * relleno), et.tamano, et.negrita)
    : { tamano: et.tamano, lineas: lineasDeTexto(texto, anchoUtil, et.tamano, et.negrita, false) };
  const { lineas } = ajustado;
  const tamano = ajustado.tamano;
  const altoLinea = tamano * INTERLINEADO;
  const total = lineas.length * altoLinea;
  const arriba =
    et.alineacionV === 'arriba' ? zona.y + relleno : et.alineacionV === 'abajo' ? zona.y + zona.alto - relleno - total : zona.y + (zona.alto - total) / 2;
  const [x, ancla] =
    et.alineacionH === 'izquierda'
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

  const salida: NodoSvg[] = [];
  lineas.forEach((linea, i) => {
    if (linea === '') return;
    salida.push(nodo('text', { x: r(x), y: r(arriba + i * altoLinea + tamano), ...comunes }, undefined, linea));
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
  hijos.push(nodo('path', { d: trazadoForma(f.forma, t.ancho, t.alto, { parametros: f.parametros, radio: f.estilo.radio }), ...atributosEstilo(f.estilo, ctx, true) }));
  if (f.texto) {
    hijos.push(...nodosTexto(f.texto, rectanguloTexto(f.forma, t.ancho, t.alto, { parametros: f.parametros }), f.estiloTexto, ctx, true));
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
  hijos.push(...nodosTexto(e.texto, { x: 0, y: 0, ancho: t.ancho, alto: t.alto }, e.estiloTexto, ctx));
  return nodo('g', { 'data-elemento-id': e.id, transform: transformacion(t.x, t.y, t.ancho, t.alto, t.rotacion), ...(e.estilo.opacidad < 1 ? { opacity: e.estilo.opacidad } : {}) }, hijos);
}

// ─── Líneas ───────────────────────────────────────────────────────────────────

function puntosDeLinea(l: Linea, ctx: Contexto): Punto[] {
  const puntos = l.puntos.map((p) => ({ ...p }));
  const origen = l.origen ? ctx.formas.get(l.origen.elementoId) : undefined;
  const destino = l.destino ? ctx.formas.get(l.destino.elementoId) : undefined;
  if (origen && l.origen) puntos[0] = puntoDePuerto(origen, l.origen.puerto);
  if (destino && l.destino) puntos[puntos.length - 1] = puntoDePuerto(destino, l.destino.puerto);
  return puntos;
}

const fp = (p: Punto): string => `${r(p.x)},${r(p.y)}`;

/** Trazado entre puntos: recto, en ángulo recto (un codo) o curvo (W7 refina el enrutado con puertos). */
function trazadoLinea(l: Linea, puntos: Punto[]): { d: string; ruta: Punto[] } {
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const horizontal = Math.abs(ultimo.x - primero.x) >= Math.abs(ultimo.y - primero.y);

  if (l.trazado === 'ortogonal' && puntos.length === 2) {
    const medio = horizontal ? { x: (primero.x + ultimo.x) / 2, y: 0 } : { x: 0, y: (primero.y + ultimo.y) / 2 };
    const ruta = horizontal
      ? [primero, { x: medio.x, y: primero.y }, { x: medio.x, y: ultimo.y }, ultimo]
      : [primero, { x: primero.x, y: medio.y }, { x: ultimo.x, y: medio.y }, ultimo];
    return { d: `M${ruta.map(fp).join(' L')}`, ruta };
  }

  if (l.trazado === 'curvo' && puntos.length === 2) {
    const c1 = horizontal ? { x: (primero.x + ultimo.x) / 2, y: primero.y } : { x: primero.x, y: (primero.y + ultimo.y) / 2 };
    const c2 = horizontal ? { x: (primero.x + ultimo.x) / 2, y: ultimo.y } : { x: ultimo.x, y: (primero.y + ultimo.y) / 2 };
    return { d: `M${fp(primero)} C${fp(c1)} ${fp(c2)} ${fp(ultimo)}`, ruta: [primero, c1, c2, ultimo] };
  }

  if (l.trazado === 'curvo' && puntos.length > 2) {
    // Catmull-Rom → cúbicas, para que la curva pase por todos los puntos.
    let d = `M${fp(puntos[0])}`;
    for (let i = 0; i < puntos.length - 1; i++) {
      const p0 = puntos[Math.max(0, i - 1)];
      const p1 = puntos[i];
      const p2 = puntos[i + 1];
      const p3 = puntos[Math.min(puntos.length - 1, i + 2)];
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += ` C${fp(c1)} ${fp(c2)} ${fp(p2)}`;
    }
    return { d, ruta: puntos };
  }

  return { d: `M${puntos.map(fp).join(' L')}`, ruta: puntos };
}

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
  const puntos = puntosDeLinea(l, ctx);
  const { d, ruta } = trazadoLinea(l, puntos);
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
    const medio = ruta[Math.floor((ruta.length - 1) / 2)];
    const siguiente = ruta[Math.floor((ruta.length - 1) / 2) + 1] ?? medio;
    const centro = ruta.length === 2 || ruta.length === 4 ? { x: (medio.x + siguiente.x) / 2, y: (medio.y + siguiente.y) / 2 } : medio;
    const ancho = Math.max(24, l.texto.length * l.estiloTexto.tamano * 0.55 + 14);
    const alto = l.estiloTexto.tamano * 1.5;
    hijos.push(
      nodo('rect', { x: r(centro.x - ancho / 2), y: r(centro.y - alto / 2), width: r(ancho), height: r(alto), rx: r(alto / 2), ...pintar(ctx.fondoEscena, ctx, 'fill'), stroke: 'none' }),
      ...nodosTexto(l.texto, { x: centro.x - ancho / 2, y: centro.y - alto / 2, ancho, alto }, { ...l.estiloTexto, alineacionH: 'centro', alineacionV: 'medio' }, ctx, true),
    );
  }

  return nodo('g', { 'data-elemento-id': l.id, ...(l.estilo.opacidad < 1 ? { opacity: l.estilo.opacidad } : {}) }, hijos);
}

// ─── Escena ───────────────────────────────────────────────────────────────────

/** Ids de los elementos ocultos, incluidos los hijos de un grupo oculto. */
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
    fondoEscena: escena.fondo ?? 'var(--background)',
  };
  const ocultos = idsOcultos(escena.elementos);

  const elementos: NodoSvg[] = [];
  for (const e of escena.elementos) {
    if (ocultos.has(e.id)) continue;
    if (e.tipo === 'forma') elementos.push(nodoForma(e, ctx));
    else if (e.tipo === 'texto') elementos.push(nodoTexto(e, ctx));
    else if (e.tipo === 'linea') elementos.push(nodoLinea(e, ctx));
    // Un grupo no se dibuja: lo dibujan sus hijos.
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
