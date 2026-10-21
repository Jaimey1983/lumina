// ─── Exportar un diagrama a SVG / PNG (V3.2) ──────────────────────────────────
// Sin dependencias: el SVG se arma a partir de los datos del bloque (no del DOM),
// con colores ya resueltos (un archivo suelto no tiene variables CSS). Las
// medidas de los nodos son estimaciones de las que dibuja el lienzo.

import { trazadoForma } from '@lumina/drawing';
import type { DiagramaGrafoBlock, DiagramaNodo, DiagramaNodoForma } from '@lumina/types/slide';

import { diagramaToGraphModel } from './diagrama-bridge.js';
import { EQUIVALENCIAS, radioDeForma } from './diagrama-formas.js';
import { resolverEstiloDiagrama } from './diagrama-temas.js';

export type TemaExportacion = 'claro' | 'oscuro';
export type FormatoExportacion = 'svg' | 'png';

export interface OpcionesExportacion {
  tema?: TemaExportacion;
  /** `true` (por defecto) pinta el fondo del tema; `false` lo deja transparente. */
  fondo?: boolean;
  /** Solo PNG: múltiplo del tamaño del SVG (por defecto 2). */
  escala?: number;
}

export interface DiagramaSvg {
  svg: string;
  ancho: number;
  alto: number;
}

interface Paleta {
  fondo: string;
  tarjeta: string;
  texto: string;
  textoSuave: string;
  arista: string;
}

const PALETAS: Record<TemaExportacion, Paleta> = {
  claro: { fondo: '#FFFFFF', tarjeta: '#FFFFFF', texto: '#0F172A', textoSuave: '#64748B', arista: '#94A3B8' },
  oscuro: { fondo: '#0F172A', tarjeta: '#1E293B', texto: '#F1F5F9', textoSuave: '#94A3B8', arista: '#64748B' },
};

const FUENTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MARGEN = 32;
const ACENTO_RAIZ = '#2563EB';
const ACENTO_RAMA = '#0D9488';

// ─── Utilidades ───────────────────────────────────────────────────────────────

export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const redondear = (n: number): number => Math.round(n * 10) / 10;

function hexARgb(color: string): [number, number, number] | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return undefined;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Mezcla `color` sobre `base` con `peso` (0–1); si alguno no es hex, devuelve `base`. */
export function mezclar(color: string, base: string, peso: number): string {
  const a = hexARgb(color);
  const b = hexARgb(base);
  if (!a || !b) return base;
  const canal = (i: number) => Math.round(a[i] * peso + b[i] * (1 - peso));
  return `#${[0, 1, 2].map((i) => canal(i).toString(16).padStart(2, '0')).join('')}`;
}

export function textoSobre(fondo: string, claro: string, oscuro: string): string {
  const rgb = hexARgb(fondo);
  if (!rgb) return claro;
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150 ? oscuro : claro;
}

/** Parte `texto` en hasta `maxLineas` líneas de ~`maxChars` caracteres; la última se corta con «…». */
export function envolverTexto(texto: string, maxChars: number, maxLineas: number): string[] {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length <= maxChars || !actual) {
      actual = candidata;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas.map((l) => (l.length > maxChars ? `${l.slice(0, maxChars - 1)}…` : l));
  const visibles = lineas.slice(0, maxLineas);
  const ultima = visibles[maxLineas - 1];
  visibles[maxLineas - 1] = `${ultima.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
  return visibles.map((l) => (l.length > maxChars ? `${l.slice(0, maxChars - 1)}…` : l));
}

// ─── Medidas de los nodos ─────────────────────────────────────────────────────

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function medirNodo(n: DiagramaNodo): Caja {
  const forma: DiagramaNodoForma = n.forma ?? 'rounded';
  const conCuerpo = Boolean(n.cuerpo);
  const porTexto = (min: number, max: number) => limitar(n.etiqueta.length * 6.6 + 36, min, max);
  const w = (porDefecto: number) => n.ancho ?? porDefecto;
  const dim = (ancho: number, alto: number) => ({ x: n.x, y: n.y, ancho, alto: n.alto ?? alto });

  switch (forma) {
    case 'root':
      return dim(w(porTexto(150, 220)), conCuerpo ? 66 : 44);
    case 'chip':
      return dim(w(porTexto(100, 180)), 32);
    case 'pill':
      return dim(w(porTexto(100, 200)), 34);
    case 'parallelogram':
      return dim(w(150), 44);
    case 'diamond':
      return dim(w(120), 90);
    case 'ellipse':
    case 'hexagon':
      return dim(w(140), 90);
    case 'trapezoid':
    case 'inverted-trapezoid':
      return dim(w(220), 46);
    case 'triangle':
      return dim(w(150), 70);
    case 'circle': {
      const d = w(120);
      return dim(d, n.alto ?? d);
    }
    default:
      return dim(w(porTexto(130, 200)), conCuerpo ? 62 : 38);
  }
}

// ─── Dibujo de nodos ──────────────────────────────────────────────────────────

function formaSvg(forma: DiagramaNodoForma, c: Caja, relleno: string, borde: string): string {
  // El círculo del diagrama siempre se exportó como elipse que llena su caja; se conserva (la escena usa el círculo inscrito).
  const eq = forma === 'circle' ? { forma: 'elipse' as const } : (EQUIVALENCIAS[forma] ?? EQUIVALENCIAS.rounded);
  const d = trazadoForma(eq.forma, c.ancho, c.alto, { parametros: eq.parametros, radio: radioDeForma(eq, c.alto) });
  return `<path d="${d}" transform="translate(${redondear(c.x)} ${redondear(c.y)})" fill="${relleno}" stroke="${borde}" stroke-width="2"/>`;
}

function textoNodo(n: DiagramaNodo, c: Caja, colorTexto: string, colorSuave: string): string {
  const forma = n.forma ?? 'rounded';
  const centroX = c.x + c.ancho / 2;
  // El triángulo escribe en su mitad baja; el resto, en el centro.
  const centroY = forma === 'triangle' ? c.y + c.alto * 0.68 : c.y + c.alto / 2;
  const util = forma === 'triangle' ? c.ancho * 0.5 : forma === 'diamond' ? c.ancho * 0.6 : c.ancho - 20;
  const maxChars = Math.max(6, Math.floor(util / 6.4));
  const titulo = envolverTexto(n.etiqueta, maxChars, 2);
  const cuerpo = n.cuerpo && forma !== 'triangle' ? envolverTexto(n.cuerpo, Math.floor(maxChars * 1.1), 2) : [];
  const totalLineas = titulo.length + cuerpo.length;
  let y = centroY - ((titulo.length * 14 + cuerpo.length * 12) / 2) + 11;
  const salida: string[] = [];
  const peso = forma === 'root' ? 700 : 600;
  for (const linea of titulo) {
    salida.push(`<text x="${redondear(centroX)}" y="${redondear(y)}" text-anchor="middle" font-size="12" font-weight="${peso}" fill="${colorTexto}">${escaparXml(linea)}</text>`);
    y += 14;
  }
  for (const linea of cuerpo) {
    salida.push(`<text x="${redondear(centroX)}" y="${redondear(y)}" text-anchor="middle" font-size="10" fill="${colorSuave}">${escaparXml(linea)}</text>`);
    y += 12;
  }
  return totalLineas === 0 ? '' : salida.join('');
}

// ─── Aristas ──────────────────────────────────────────────────────────────────

type Lado = 'top' | 'bottom' | 'left' | 'right';
interface Punto {
  x: number;
  y: number;
}

const VECTOR: Record<Lado, Punto> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function ladoDe(handle: unknown, porDefecto: Lado): Lado {
  const nombre = typeof handle === 'string' ? handle.replace(/^source-/, '') : '';
  return nombre === 'top' || nombre === 'bottom' || nombre === 'left' || nombre === 'right' ? nombre : porDefecto;
}

function anclaje(c: Caja, lado: Lado): Punto {
  switch (lado) {
    case 'top':
      return { x: c.x + c.ancho / 2, y: c.y };
    case 'bottom':
      return { x: c.x + c.ancho / 2, y: c.y + c.alto };
    case 'left':
      return { x: c.x, y: c.y + c.alto / 2 };
    default:
      return { x: c.x + c.ancho, y: c.y + c.alto / 2 };
  }
}

/** Polilínea con esquinas redondeadas (radio 0 = esquinas vivas). */
function polilinea(puntos: Punto[], radio: number): string {
  if (puntos.length < 2) return '';
  const f = (p: Punto) => `${redondear(p.x)},${redondear(p.y)}`;
  let d = `M${f(puntos[0])}`;
  for (let i = 1; i < puntos.length - 1; i++) {
    const prev = puntos[i - 1];
    const act = puntos[i];
    const sig = puntos[i + 1];
    const l1 = Math.hypot(act.x - prev.x, act.y - prev.y);
    const l2 = Math.hypot(sig.x - act.x, sig.y - act.y);
    const r = Math.min(radio, l1 / 2, l2 / 2);
    if (r <= 0) {
      d += ` L${f(act)}`;
      continue;
    }
    const a = { x: act.x + ((prev.x - act.x) / l1) * r, y: act.y + ((prev.y - act.y) / l1) * r };
    const b = { x: act.x + ((sig.x - act.x) / l2) * r, y: act.y + ((sig.y - act.y) / l2) * r };
    d += ` L${f(a)} Q${f(act)} ${f(b)}`;
  }
  return `${d} L${f(puntos[puntos.length - 1])}`;
}

function codoOrtogonal(p1: Punto, l1: Lado, p2: Punto, l2: Lado): Punto[] {
  const horizontal1 = l1 === 'left' || l1 === 'right';
  const horizontal2 = l2 === 'left' || l2 === 'right';
  if (horizontal1 && horizontal2) {
    const mx = (p1.x + p2.x) / 2;
    return [p1, { x: mx, y: p1.y }, { x: mx, y: p2.y }, p2];
  }
  if (!horizontal1 && !horizontal2) {
    const my = (p1.y + p2.y) / 2;
    return [p1, { x: p1.x, y: my }, { x: p2.x, y: my }, p2];
  }
  return horizontal1 ? [p1, { x: p2.x, y: p1.y }, p2] : [p1, { x: p1.x, y: p2.y }, p2];
}

function puntaFlecha(punta: Punto, desde: Punto, grosor: number, color: string): string {
  const largo = 7 + grosor * 1.5;
  const ancho = 3.5 + grosor;
  const len = Math.hypot(punta.x - desde.x, punta.y - desde.y) || 1;
  const ux = (punta.x - desde.x) / len;
  const uy = (punta.y - desde.y) / len;
  const base = { x: punta.x - ux * largo, y: punta.y - uy * largo };
  const p = (q: Punto) => `${redondear(q.x)},${redondear(q.y)}`;
  const a = { x: base.x - uy * ancho, y: base.y + ux * ancho };
  const b = { x: base.x + uy * ancho, y: base.y - ux * ancho };
  return `<polygon points="${p(punta)} ${p(a)} ${p(b)}" fill="${color}"/>`;
}

const GUIONES: Record<string, string> = { discontinua: '6 5', punteada: '2 4' };

// ─── Documento ────────────────────────────────────────────────────────────────

/** Arma el SVG del diagrama con colores ya resueltos para el tema pedido. */
export function diagramaToSvg(block: DiagramaGrafoBlock, opciones: OpcionesExportacion = {}): DiagramaSvg {
  const paleta = PALETAS[opciones.tema ?? 'claro'];
  const conFondo = opciones.fondo !== false;
  const estilo = resolverEstiloDiagrama(block.opciones, block.subtipo);
  const modelo = diagramaToGraphModel(block);

  const cajas = new Map<string, Caja>(block.nodos.map((n) => [n.id, medirNodo(n)]));

  // Encuadre: caja que contiene todos los nodos (+ título) con margen.
  const todas = [...cajas.values()];
  const minX = Math.min(...todas.map((c) => c.x), 0);
  const minY = Math.min(...todas.map((c) => c.y), 0);
  const maxX = Math.max(...todas.map((c) => c.x + c.ancho), minX + 1);
  const maxY = Math.max(...todas.map((c) => c.y + c.alto), minY + 1);
  const titulo = block.titulo?.trim();
  const altoTitulo = titulo ? 30 : 0;
  const ancho = Math.ceil(Math.max(maxX - minX + MARGEN * 2, titulo ? titulo.length * 9 + MARGEN * 2 : 0));
  const alto = Math.ceil(maxY - minY + MARGEN * 2 + altoTitulo);
  const dx = MARGEN - minX;
  const dy = MARGEN - minY + altoTitulo;

  const aristasSvg: string[] = [];
  for (const arista of modelo.edges) {
    const origen = cajas.get(arista.source);
    const destino = cajas.get(arista.target);
    if (!origen || !destino) continue;
    const meta = arista.meta ?? {};
    const colorMeta = typeof meta.color === 'string' && !meta.color.startsWith('var(') ? meta.color : undefined;
    const color = colorMeta ?? paleta.arista;
    const grosor = typeof meta.grosor === 'number' ? meta.grosor : estilo.conector.grosor;
    const trazado = typeof meta.tipoTrazado === 'string' ? meta.tipoTrazado : estilo.conector.trazado;
    const patron = typeof meta.estiloLinea === 'string' ? meta.estiloLinea : 'solida';

    const l1 = ladoDe(meta.sourceHandle, 'bottom');
    const l2 = ladoDe(meta.targetHandle, 'top');
    const p1 = anclaje(origen, l1);
    const p2 = anclaje(destino, l2);

    let d: string;
    let inicioDesde: Punto;
    let finDesde: Punto;
    let medio: Punto;
    if (trazado === 'straight') {
      d = polilinea([p1, p2], 0);
      inicioDesde = p2;
      finDesde = p1;
      medio = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    } else if (trazado === 'bezier') {
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const off = Math.max(40, dist * 0.35);
      const c1 = { x: p1.x + VECTOR[l1].x * off, y: p1.y + VECTOR[l1].y * off };
      const c2 = { x: p2.x + VECTOR[l2].x * off, y: p2.y + VECTOR[l2].y * off };
      const f = (p: Punto) => `${redondear(p.x)},${redondear(p.y)}`;
      d = `M${f(p1)} C${f(c1)} ${f(c2)} ${f(p2)}`;
      inicioDesde = c1;
      finDesde = c2;
      medio = {
        x: p1.x * 0.125 + c1.x * 0.375 + c2.x * 0.375 + p2.x * 0.125,
        y: p1.y * 0.125 + c1.y * 0.375 + c2.y * 0.375 + p2.y * 0.125,
      };
    } else {
      const codo = codoOrtogonal(p1, l1, p2, l2);
      d = polilinea(codo, trazado === 'orthogonal' ? 0 : 8);
      inicioDesde = codo[1];
      finDesde = codo[codo.length - 2];
      const m = Math.floor((codo.length - 1) / 2);
      medio = { x: (codo[m].x + codo[m + 1].x) / 2, y: (codo[m].y + codo[m + 1].y) / 2 };
    }

    const partes = [
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round"${GUIONES[patron] ? ` stroke-dasharray="${GUIONES[patron]}"` : ''}/>`,
    ];
    if (arista.directed) partes.push(puntaFlecha(p2, finDesde, grosor, color));
    if (meta.flechaInicio === true) partes.push(puntaFlecha(p1, inicioDesde, grosor, color));
    if (arista.label) {
      const texto = escaparXml(arista.label);
      const w = Math.max(24, arista.label.length * 5.8 + 14);
      partes.push(
        `<rect x="${redondear(medio.x - w / 2)}" y="${redondear(medio.y - 9)}" width="${redondear(w)}" height="18" rx="9" fill="${paleta.tarjeta}" stroke="${paleta.arista}" stroke-width="1"/>`,
        `<text x="${redondear(medio.x)}" y="${redondear(medio.y + 3.5)}" text-anchor="middle" font-size="10" font-weight="500" fill="${paleta.texto}">${texto}</text>`,
      );
    }
    aristasSvg.push(`<g data-arista-id="${escaparXml(arista.id)}">${partes.join('')}</g>`);
  }

  const nodosSvg = block.nodos.map((n, i) => {
    const caja = cajas.get(n.id)!;
    const forma: DiagramaNodoForma = n.forma ?? (i === 0 ? 'root' : 'rounded');
    const esRaiz = i === 0 || n.estilo?.destacado === true;
    const acento = typeof n.estilo?.color === 'string' ? n.estilo.color : esRaiz ? ACENTO_RAIZ : ACENTO_RAMA;
    let relleno = paleta.tarjeta;
    let colorTexto = paleta.texto;
    let colorSuave = paleta.textoSuave;
    if (estilo.relleno === 'tintado') {
      relleno = mezclar(acento, paleta.tarjeta, 0.14);
    } else if (estilo.relleno === 'solido') {
      relleno = hexARgb(acento) ? acento : paleta.tarjeta;
      colorTexto = textoSobre(relleno, '#FFFFFF', '#0F172A');
      colorSuave = colorTexto;
    }
    const figura = formaSvg(forma, caja, relleno, acento);
    const texto = textoNodo({ ...n, forma }, caja, colorTexto, colorSuave);
    return `<g data-nodo-id="${escaparXml(n.id)}">${figura}${texto}</g>`;
  });

  const fondo = conFondo ? `<rect width="${ancho}" height="${alto}" fill="${paleta.fondo}"/>` : '';
  const cabecera = titulo
    ? `<text x="${redondear(ancho / 2)}" y="${MARGEN - 6}" text-anchor="middle" font-size="16" font-weight="700" fill="${paleta.texto}">${escaparXml(titulo)}</text>`
    : '';
  const descripcion = block.descripcionAccesible?.trim();

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" font-family='${FUENTE}' role="img">` +
    `<title>${escaparXml(titulo || 'Diagrama')}</title>` +
    (descripcion ? `<desc>${escaparXml(descripcion)}</desc>` : '') +
    fondo +
    cabecera +
    `<g transform="translate(${redondear(dx)} ${redondear(dy)})">${aristasSvg.join('')}${nodosSvg.join('')}</g>` +
    `</svg>`;

  return { svg, ancho, alto };
}

// ─── Descarga ─────────────────────────────────────────────────────────────────

/** Nombre de archivo seguro a partir del título («Mapa del ciclo» → «mapa-del-ciclo.svg»). */
export function nombreArchivo(block: Pick<DiagramaGrafoBlock, 'titulo'>, extension: FormatoExportacion): string {
  const base = (block.titulo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'diagrama'}.${extension}`;
}

/** Rasteriza un SVG a PNG en el navegador (canvas); rechaza si el SVG no carga. */
export function svgAPng(svg: string, ancho: number, alto: number, escala = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const imagen = new Image();
    imagen.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(ancho * escala);
        canvas.height = Math.round(alto * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('El navegador no permite dibujar en un canvas.');
        ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.'))), 'image/png');
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar el SVG del diagrama.'));
    };
    imagen.src = url;
  });
}

export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/** Genera y descarga el diagrama en el formato pedido. */
export async function exportarDiagrama(
  block: DiagramaGrafoBlock,
  formato: FormatoExportacion,
  opciones: OpcionesExportacion = {},
): Promise<void> {
  const { svg, ancho, alto } = diagramaToSvg(block, opciones);
  const blob =
    formato === 'svg'
      ? new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      : await svgAPng(svg, ancho, alto, opciones.escala);
  descargarBlob(blob, nombreArchivo(block, formato));
}
