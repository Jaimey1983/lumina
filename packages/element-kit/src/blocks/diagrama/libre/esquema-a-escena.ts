// ─── Esquema de texto → diagrama (Y14, Y36) ───────────────────────────────────
// Puro: sin React ni DOM. Analiza un esquema (`analizarEsquema`: sangría, encabezados y numeración, ver `esquema-niveles.ts`) y lo
// vuelve formas y conectores de la escena (`esquemaAEscena`). El analizador del bloque `diagrama` anterior no se usa ni se toca.

import { agregar, cajaDeElemento, mover, sincronizarConectores, conectarFormas, type Escena, type Forma, type Punto } from "@lumina/drawing";
import { PALETAS_DIAGRAMA } from "../diagrama-temas.js";
import { nivelesDeLineas } from "./esquema-niveles.js";
import { organizarAuto, type ModoOrganizar } from "./editor/organizar-auto.js";

/** Nodos que entran de una vez (DW9). */
export const MAX_NODOS_ESQUEMA = 200;
/** Caracteres por línea; lo que sobra se recorta. */
export const MAX_LARGO_LINEA_ESQUEMA = 200;

export interface NodoEsquema {
  texto: string;
  /** Posición del padre en `Esquema.nodos`; `null` si es una raíz. */
  padre: number | null;
  /** Profundidad real en el árbol (0 = raíz), no la sangría escrita. */
  nivel: number;
  /** Índice de la rama principal (hijo de una raíz y todo lo que cuelga de él); `null` en las raíces. */
  rama: number | null;
}

export interface Esquema {
  /** Los nodos que se van a crear (a lo sumo `MAX_NODOS_ESQUEMA`), padres antes que hijos. */
  nodos: NodoEsquema[];
  raices: number;
  /** Cantidad de niveles (profundidad máxima + 1). */
  niveles: number;
  /** Cuántos nodos se dejaron fuera por pasar el máximo. */
  sobrantes: number;
  /** Cuántas líneas se recortaron por pasar el largo máximo. */
  recortadas: number;
  /** No se detectó jerarquía: hay 3 o más nodos y todos son raíz (Y36). Es `false` si se aplicó `primeraLineaEsTema`. */
  sinJerarquia: boolean;
}

export interface OpcionesAnalisis {
  /** La primera línea es el tema y todas las demás suben un nivel (Y36). Solo desplaza niveles: no reinterpreta nada. */
  primeraLineaEsTema?: boolean;
}

/** Con 3 o más nodos y todos raíz no hay jerarquía: es lo que pasa con un esquema pegado sin sangría (Y36). */
const MIN_NODOS_SIN_JERARQUIA = 3;

/**
 * Lee el esquema: encabezados `#`, sangría con espacios (2 = un nivel) o tabuladores, viñetas (`-`, `*`, `+`, `•`), numeración
 * (`1.`, `1)`, y `1.1`, `1.1.1` en las líneas sin sangría) y listas de Markdown; las líneas vacías no cuentan. Un nivel que salta de
 * golpe cuelga del nivel anterior, y varias raíces forman un bosque. Los niveles de cada línea los fija `nivelesDeLineas` (DY56).
 */
export function analizarEsquema(texto: string, opciones: OpcionesAnalisis = {}): Esquema {
  const items = nivelesDeLineas(texto);
  const base = construir(items, items.length);
  if (!opciones.primeraLineaEsTema || items.length === 0) return base;
  const desplazados = items.map((it, i) => (i === 0 ? it : { ...it, nivel: it.nivel + 1 }));
  return { ...construir(desplazados, items.length), sinJerarquia: false };
}

function construir(items: ReadonlyArray<{ nivel: number; texto: string }>, total: number): Esquema {
  const nodos: NodoEsquema[] = [];
  const pila: { indice: number; sangria: number }[] = [];
  let ramas = 0;
  let recortadas = 0;
  for (const item of items.slice(0, MAX_NODOS_ESQUEMA)) {
    while (pila.length > 0 && (pila[pila.length - 1] as { sangria: number }).sangria >= item.nivel) pila.pop();
    const padre = pila.length > 0 ? (pila[pila.length - 1] as { indice: number }).indice : null;
    const padreNodo = padre === null ? null : (nodos[padre] as NodoEsquema);
    const nivel = padreNodo ? padreNodo.nivel + 1 : 0;
    const rama = padreNodo === null ? null : padreNodo.rama ?? ramas++;
    const letras = Array.from(item.texto);
    if (letras.length > MAX_LARGO_LINEA_ESQUEMA) recortadas++;
    nodos.push({ texto: letras.slice(0, MAX_LARGO_LINEA_ESQUEMA).join(""), padre, nivel, rama });
    pila.push({ indice: nodos.length - 1, sangria: item.nivel });
  }
  const raices = nodos.filter((n) => n.padre === null).length;
  return {
    nodos,
    raices,
    niveles: nodos.reduce((m, n) => Math.max(m, n.nivel + 1), 0),
    sobrantes: Math.max(0, total - MAX_NODOS_ESQUEMA),
    recortadas,
    sinJerarquia: nodos.length >= MIN_NODOS_SIN_JERARQUIA && raices === nodos.length,
  };
}

// ─── Aspecto ──────────────────────────────────────────────────────────────────

const COLOR_RAIZ = "#334155";
/** Colores de rama: los acentos de las paletas de diagrama del editor (sin el de las raíces). */
export const COLORES_DE_RAMA: readonly string[] = [...new Set(Object.values(PALETAS_DIAGRAMA).map((p) => p.acentoPrincipal.toUpperCase()))].filter((c) => c !== COLOR_RAIZ.toUpperCase());

/** Mezcla un color `#RRGGBB` con blanco (`t` = cuánto blanco, de 0 a 1): el relleno claro de cada rama. */
function aclarar(hex: string, t: number): string {
  const canal = (i: number): string => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(v + (255 - v) * t).toString(16).padStart(2, "0");
  };
  return `#${canal(0)}${canal(1)}${canal(2)}`.toUpperCase();
}

const ANCHO_MIN = 120;
const ANCHO_MAX = 280;
const PX_POR_LETRA = 7.5;
const ALTO_MIN = 44;
const ALTO_LINEA = 18;

/** Tamaño de la forma según el largo del texto, para que entre sin salirse. */
function tamanoDeNodo(texto: string): { ancho: number; alto: number } {
  const largo = Array.from(texto).length;
  const ancho = Math.min(ANCHO_MAX, Math.max(ANCHO_MIN, Math.round(largo * PX_POR_LETRA + 32)));
  const porLinea = Math.max(1, Math.floor((ancho - 32) / PX_POR_LETRA));
  const lineas = Math.ceil(largo / porLinea);
  return { ancho, alto: Math.max(ALTO_MIN, lineas * ALTO_LINEA + 24) };
}

function entradaDeNodo(n: NodoEsquema, y: number): Parameters<typeof agregar>[1] {
  const { ancho, alto } = tamanoDeNodo(n.texto);
  const color = n.rama === null ? COLOR_RAIZ : (COLORES_DE_RAMA[n.rama % COLORES_DE_RAMA.length] as string);
  const raiz = n.rama === null;
  return {
    tipo: "forma",
    forma: "rectangulo-redondeado",
    transformacion: { x: 0, y, ancho, alto, rotacion: 0 },
    texto: n.texto,
    estilo: {
      relleno: { tipo: "solido", color: raiz ? COLOR_RAIZ : aclarar(color, 0.85) },
      contorno: { color, grosor: 2, patron: "solido" },
      radio: 0,
    },
    estiloTexto: { tamano: 14, negrita: raiz, alineacionH: "centro", alineacionV: "medio", color: raiz ? "#FFFFFF" : "#0F172A" },
  };
}

// ─── Escena ───────────────────────────────────────────────────────────────────

export interface OpcionesEsquemaAEscena {
  modo: ModoOrganizar;
  /** Dónde queda el centro de todo lo creado (el centro de lo que se ve). */
  centro: Punto;
}

export interface ResultadoEsquemaAEscena {
  escena: Escena;
  /** Lo creado, para dejarlo elegido: las formas y sus conectores. */
  ids: string[];
}

/**
 * Agrega al final de la escena una forma por nodo y un conector ortogonal con flecha del padre a cada hijo, los dispone
 * (`modo`) y los centra en `centro`. Un esquema vacío devuelve la misma escena. Pura: no toca lo que ya había.
 */
export function esquemaAEscena(escena: Escena, esquema: Esquema, opciones: OpcionesEsquemaAEscena): ResultadoEsquemaAEscena {
  if (esquema.nodos.length === 0) return { escena, ids: [] };
  const antes = new Set(escena.elementos.map((e) => e.id));
  let actual = escena;
  const formas: string[] = [];
  let y = 0;
  for (const nodo of esquema.nodos) {
    const entrada = entradaDeNodo(nodo, y);
    const r = agregar(actual, entrada);
    if (r.id === "") return { escena, ids: [] };
    actual = r.escena;
    formas.push(r.id);
    y += tamanoDeNodo(nodo.texto).alto + 20;
  }
  esquema.nodos.forEach((nodo, i) => {
    if (nodo.padre !== null) actual = conectarFormas(actual, formas[nodo.padre] as string, formas[i] as string);
  });

  const r = organizarAuto(actual, formas, { modo: opciones.modo, direccion: opciones.modo === "jerarquico" ? "abajo" : "derecha" });
  if (r.motivo === undefined) actual = r.escena;

  // Centrado: la caja de todas las formas nuevas va al centro pedido.
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const e of actual.elementos) {
    if (e.tipo !== "forma" || !formas.includes(e.id)) continue;
    const c = cajaDeElemento(actual, e as Forma);
    if (!c) continue;
    x0 = Math.min(x0, c.x);
    y0 = Math.min(y0, c.y);
    x1 = Math.max(x1, c.x + c.ancho);
    y1 = Math.max(y1, c.y + c.alto);
  }
  if (Number.isFinite(x0)) actual = sincronizarConectores(mover(actual, formas, opciones.centro.x - (x0 + x1) / 2, opciones.centro.y - (y0 + y1) / 2));

  const lineas = actual.elementos.filter((e) => e.tipo === "linea" && !antes.has(e.id)).map((e) => e.id);
  return { escena: actual, ids: [...formas, ...lineas] };
}
