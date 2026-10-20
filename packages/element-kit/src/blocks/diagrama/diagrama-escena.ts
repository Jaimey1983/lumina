// ─── Diagrama → escena de dibujo libre (W5b) ──────────────────────────────────
// Convierte un diagrama (grafo o Venn) en una `Escena` de `@lumina/drawing` equivalente, para que
// el docente pueda editarlo con libertad: cada nodo pasa a ser una forma, cada arista un conector
// pegado a los mismos puertos, y cada elemento de Venn una etiqueta en su región.
// Función pura: no toca el bloque original.

import {
  esColorValido,
  normalizarEscena,
  type Elemento,
  type Escena,
  type Forma,
  type Linea,
  type PatronLinea,
  type Trazado,
} from '@lumina/drawing';
import type {
  DiagramaArista,
  DiagramaBlock,
  DiagramaGrafoBlock,
  DiagramaNodo,
  DiagramaNodoForma,
  DiagramaVennBlock,
} from '@lumina/types/slide';
import { diagramaToGraphModel } from './diagrama-bridge.js';
import { EQUIVALENCIAS, radioDeForma } from './diagrama-formas.js';
import { medirNodo, mezclar, textoSobre, type Caja } from './diagrama-export.js';
import { regionCentroid } from './diagrama-regions.js';
import { coloresVenn, resolverEstiloArista, resolverEstiloDiagrama } from './diagrama-temas.js';
import { nombreConjunto } from './venn-svg.js';

const MARGEN = 40;
const ACENTO_RAIZ = '#2563EB';
const ACENTO_RAMA = '#0D9488';

const TRAZADOS: Record<string, Trazado> = { straight: 'recto', bezier: 'curvo', smoothstep: 'ortogonal', orthogonal: 'ortogonal' };
const PATRONES: Record<string, PatronLinea> = { solida: 'solido', discontinua: 'guiones', punteada: 'puntos' };

/** Índice del puerto de una forma para cada lado (orden del catálogo: arriba, derecha, abajo, izquierda). */
const PUERTO_DE_LADO: Record<string, number> = { top: 0, right: 1, bottom: 2, left: 3 };

function ladoDe(handle: unknown, porDefecto: string): string {
  const nombre = typeof handle === 'string' ? handle.replace(/^source-/, '') : '';
  return nombre in PUERTO_DE_LADO ? nombre : porDefecto;
}

function anclaje(c: Caja, lado: string): { x: number; y: number } {
  if (lado === 'top') return { x: c.x + c.ancho / 2, y: c.y };
  if (lado === 'bottom') return { x: c.x + c.ancho / 2, y: c.y + c.alto };
  if (lado === 'left') return { x: c.x, y: c.y + c.alto / 2 };
  return { x: c.x + c.ancho, y: c.y + c.alto / 2 };
}

/** Ids válidos y únicos para la escena (`[A-Za-z0-9_-]{1,64}`), uno por cada id original. */
function idsSeguros(originales: readonly string[], prefijo: string): Map<string, string> {
  const usados = new Set<string>();
  const salida = new Map<string, string>();
  originales.forEach((original, i) => {
    let base = original.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 56) || `${prefijo}-${i + 1}`;
    let candidato = base;
    for (let n = 2; usados.has(candidato); n++) candidato = `${base.slice(0, 56)}-${n}`;
    base = candidato;
    usados.add(base);
    salida.set(original, base);
  });
  return salida;
}

const colorOr = (valor: unknown, porDefecto: string): string => (typeof valor === 'string' && esColorValido(valor) ? valor : porDefecto);

function convertirGrafo(block: DiagramaGrafoBlock): Escena {
  const estilo = resolverEstiloDiagrama(block.opciones, block.subtipo);
  const cajas = new Map<string, Caja>(block.nodos.map((n) => [n.id, medirNodo(n)]));
  const ids = idsSeguros(
    block.nodos.map((n) => n.id),
    'nodo',
  );

  const todas = [...cajas.values()];
  const minX = Math.min(...todas.map((c) => c.x));
  const minY = Math.min(...todas.map((c) => c.y));
  const maxX = Math.max(...todas.map((c) => c.x + c.ancho));
  const maxY = Math.max(...todas.map((c) => c.y + c.alto));
  const dx = MARGEN - minX;
  const dy = MARGEN - minY;
  const desplazada = (c: Caja): Caja => ({ x: c.x + dx, y: c.y + dy, ancho: c.ancho, alto: c.alto });

  const elementos: Elemento[] = [];

  // Las aristas van debajo de los nodos (como en el lienzo del diagrama).
  const modelo = diagramaToGraphModel(block);
  const originales = new Map<string, DiagramaArista>(block.aristas.map((a) => [a.id, a]));
  const idsAristas = idsSeguros(
    modelo.edges.map((e) => e.id),
    'arista',
  );
  for (const e of modelo.edges) {
    const origen = cajas.get(e.source);
    const destino = cajas.get(e.target);
    const idOrigen = ids.get(e.source);
    const idDestino = ids.get(e.target);
    const arista = originales.get(e.id);
    if (!origen || !destino || !idOrigen || !idDestino || !arista) continue;
    const meta = e.meta ?? {};
    const conector = resolverEstiloArista(arista, estilo);
    const l1 = ladoDe(meta.sourceHandle, 'bottom');
    const l2 = ladoDe(meta.targetHandle, 'top');
    const p1 = anclaje(desplazada(origen), l1);
    const p2 = anclaje(desplazada(destino), l2);
    const linea: Linea = {
      id: idsAristas.get(e.id) ?? e.id,
      tipo: 'linea',
      bloqueado: false,
      oculto: false,
      puntos: [p1, p2],
      trazado: TRAZADOS[conector.trazado] ?? 'ortogonal',
      inicio: meta.flechaInicio === true ? 'flecha' : 'ninguno',
      fin: e.directed ? 'flecha' : 'ninguno',
      origen: { elementoId: idOrigen, puerto: PUERTO_DE_LADO[l1] ?? 2 },
      destino: { elementoId: idDestino, puerto: PUERTO_DE_LADO[l2] ?? 0 },
      estilo: {
        relleno: { tipo: 'ninguno' },
        contorno: { color: colorOr(meta.color, 'var(--muted-foreground)'), grosor: conector.grosor, patron: PATRONES[conector.patron] ?? 'solido' },
        opacidad: 1,
        sombra: null,
        radio: 0,
      },
      ...(e.label ? { texto: e.label } : {}),
      estiloTexto: { tamano: 12, negrita: false, cursiva: false, subrayado: false, alineacionH: 'centro', alineacionV: 'medio', color: 'var(--foreground)', fuente: '' },
    };
    elementos.push(linea);
  }

  // La cebolla son círculos concéntricos: los más grandes van debajo, o taparían a los de dentro.
  const orden = block.nodos.map((n, i) => ({ n, i }));
  if (block.subtipo === 'cebolla') {
    orden.sort((a, b) => {
      const ca = cajas.get(a.n.id) as Caja;
      const cb = cajas.get(b.n.id) as Caja;
      return cb.ancho * cb.alto - ca.ancho * ca.alto || a.i - b.i;
    });
  }
  orden.forEach(({ n, i }) => {
    const caja = desplazada(cajas.get(n.id) as Caja);
    const nodoForma: DiagramaNodoForma = n.forma ?? (i === 0 ? 'root' : 'rounded');
    const eq = EQUIVALENCIAS[nodoForma] ?? EQUIVALENCIAS.rounded;
    const esRaiz = i === 0 || n.estilo?.destacado === true;
    const acento = colorOr(n.estilo?.color, esRaiz ? ACENTO_RAIZ : ACENTO_RAMA);
    const esHex = acento.startsWith('#');
    let relleno = 'var(--card)';
    let colorTexto = 'var(--foreground)';
    if (estilo.relleno === 'tintado' && esHex) relleno = mezclar(acento, '#FFFFFF', 0.14);
    else if (estilo.relleno === 'solido' && esHex) {
      relleno = acento;
      colorTexto = textoSobre(acento, '#FFFFFF', '#0F172A');
    }
    const texto = n.cuerpo ? `${n.etiqueta}\n${n.cuerpo}` : n.etiqueta;
    const forma: Forma = {
      id: ids.get(n.id) ?? n.id,
      tipo: 'forma',
      bloqueado: false,
      oculto: false,
      forma: eq.forma,
      transformacion: { x: caja.x, y: caja.y, ancho: caja.ancho, alto: caja.alto, rotacion: 0 },
      estilo: {
        relleno: { tipo: 'solido', color: relleno },
        contorno: { color: acento, grosor: 2, patron: 'solido' },
        opacidad: 1,
        sombra: estilo.sombra ? { color: '#00000026', desenfoque: 6, dx: 0, dy: 2 } : null,
        radio: radioDeForma(eq, caja.alto),
      },
      texto,
      estiloTexto: { tamano: 13, negrita: nodoForma === 'root', cursiva: false, subrayado: false, alineacionH: 'centro', alineacionV: 'medio', color: colorTexto, fuente: '' },
      ...(eq.parametros ? { parametros: eq.parametros } : {}),
    };
    elementos.push(forma);
  });

  return normalizarEscena({
    ancho: Math.ceil(maxX - minX + MARGEN * 2),
    alto: Math.ceil(maxY - minY + MARGEN * 2),
    fondo: null,
    elementos,
  });
}

// ─── Venn ─────────────────────────────────────────────────────────────────────

const ESCALA_VENN = 8; // el diagrama de Venn se define en un viewBox de 100 × 100
const ALTO_ETIQUETA = 52;

/** Ancho de una etiqueta de Venn según su texto (con letra de 24). */
const anchoEtiqueta = (texto: string): number => Math.min(340, Math.max(110, texto.length * 14 + 56));

function convertirVenn(block: DiagramaVennBlock): Escena {
  const lado = 100 * ESCALA_VENN;
  const colores = coloresVenn(block.opciones?.paleta);
  const centros =
    block.conjuntos === 2
      ? [
          { id: 'A', cx: 38, cy: 48, r: 28 },
          { id: 'B', cx: 62, cy: 48, r: 28 },
        ]
      : [
          { id: 'A', cx: 38, cy: 38, r: 26 },
          { id: 'B', cx: 62, cy: 38, r: 26 },
          { id: 'C', cx: 50, cy: 62, r: 26 },
        ];
  const elementos: Elemento[] = [];
  const estiloTextoBase = { tamano: 16, negrita: false, cursiva: false, subrayado: false, alineacionH: 'centro' as const, alineacionV: 'medio' as const, color: 'var(--foreground)', fuente: '' };

  centros.forEach((c, i) => {
    const color = colores[i] ?? '#2563EB';
    elementos.push({
      id: `conjunto-${c.id.toLowerCase()}`,
      tipo: 'forma',
      bloqueado: false,
      oculto: false,
      forma: 'circulo',
      nombre: `Conjunto ${nombreConjunto(block, i)}`,
      transformacion: { x: (c.cx - c.r) * ESCALA_VENN, y: (c.cy - c.r) * ESCALA_VENN, ancho: c.r * 2 * ESCALA_VENN, alto: c.r * 2 * ESCALA_VENN, rotacion: 0 },
      estilo: {
        relleno: { tipo: 'solido', color: `${color}38` },
        contorno: { color: `${color}99`, grosor: 3, patron: 'solido' },
        opacidad: 1,
        sombra: null,
        radio: 0,
      },
      estiloTexto: estiloTextoBase,
    });
  });

  centros.forEach((c, i) => {
    const x = c.id === 'A' ? c.cx - 16 : c.id === 'B' ? c.cx + 16 : c.cx;
    const y = c.id === 'C' ? c.cy + 18 : c.cy - 16;
    elementos.push({
      id: `nombre-${c.id.toLowerCase()}`,
      tipo: 'texto',
      bloqueado: false,
      oculto: false,
      texto: nombreConjunto(block, i),
      transformacion: { x: x * ESCALA_VENN - 150, y: y * ESCALA_VENN - 32, ancho: 300, alto: 64, rotacion: 0 },
      estilo: { relleno: { tipo: 'ninguno' }, contorno: { color: '#000000', grosor: 0, patron: 'solido' }, opacidad: 1, sombra: null, radio: 0 },
      estiloTexto: { ...estiloTextoBase, tamano: 44, negrita: true },
    });
  });

  const etiqueta = (id: string, texto: string, cx: number, y: number): Forma => {
    const ancho = anchoEtiqueta(texto);
    return {
      id,
      tipo: 'forma',
      bloqueado: false,
      oculto: false,
      forma: 'rectangulo',
      transformacion: { x: cx - ancho / 2, y, ancho, alto: ALTO_ETIQUETA, rotacion: 0 },
      estilo: {
        relleno: { tipo: 'solido', color: 'var(--background)' },
        contorno: { color: 'var(--border)', grosor: 1.5, patron: 'solido' },
        opacidad: 1,
        sombra: { color: '#0000001F', desenfoque: 4, dx: 0, dy: 1 },
        radio: ALTO_ETIQUETA / 2,
      },
      texto,
      estiloTexto: { ...estiloTextoBase, tamano: 24, negrita: true },
    };
  };

  // Dentro de los conjuntos: apiladas alrededor del centro de su región.
  const porRegion = new Map<string, typeof block.elementos>();
  for (const el of block.elementos) {
    if (el.regionId === null) continue;
    porRegion.set(el.regionId, [...(porRegion.get(el.regionId) ?? []), el]);
  }
  for (const [regionId, lista] of porRegion) {
    const c = regionCentroid(regionId, block.conjuntos);
    const alto = lista.length * ALTO_ETIQUETA + (lista.length - 1) * 8;
    lista.forEach((el, i) => elementos.push(etiqueta(`elemento-${el.id.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 50)}-${i}`, el.texto, c.x * ESCALA_VENN, c.y * ESCALA_VENN - alto / 2 + i * (ALTO_ETIQUETA + 8))));
  }

  // Fuera de los conjuntos: en filas debajo del dibujo.
  const fuera = block.elementos.filter((el) => el.regionId === null);
  let x = 30;
  let y = lado + 30;
  fuera.forEach((el, i) => {
    const ancho = anchoEtiqueta(el.texto);
    if (x + ancho > lado - 30 && x > 30) {
      x = 30;
      y += ALTO_ETIQUETA + 12;
    }
    elementos.push(etiqueta(`fuera-${i}`, el.texto, x + ancho / 2, y));
    x += ancho + 12;
  });

  return normalizarEscena({ ancho: lado, alto: fuera.length > 0 ? y + ALTO_ETIQUETA + 30 : lado, fondo: null, elementos });
}

/** Escena de dibujo libre equivalente al diagrama (no modifica el bloque). */
export function diagramaAEscena(block: DiagramaBlock): Escena {
  return block.subtipo === 'venn' ? convertirVenn(block as DiagramaVennBlock) : convertirGrafo(block as DiagramaGrafoBlock);
}
