// ─── Organizar automáticamente (Y13) ──────────────────────────────────────────
// Une el motor puro de `@lumina/drawing` (grafo, árbol, radial, cuadrícula, aplicar) con dagre, que vive en
// `@lumina/editor-shared` y por eso no puede estar en el paquete de dibujo.

import { computeDagreLayout, type GraphEdge, type GraphNode } from "@lumina/editor-shared/graph-editor";
import {
  aplicarDisposicion,
  cajaDeNodos,
  componerPosiciones,
  comprimirParaQueQuepa,
  disponerArbol,
  disponerRadial,
  esBosque,
  extraerGrafo,
  hayPisadas,
  MARGEN_PAGINA,
  separarSueltos,
  superficieDeNodos,
  trasladarAPagina,
  type AristaDisposicion,
  type Escena,
  type NodoDisposicion,
  type Pagina,
  type Posiciones,
  type Punto,
} from "@lumina/drawing";

export type ModoOrganizar = "jerarquico" | "arbol" | "radial";
export type DireccionOrganizar = "abajo" | "derecha" | "arriba" | "izquierda";

export interface OpcionesOrganizar {
  modo: ModoOrganizar;
  /** Jerárquico: las cuatro. Árbol: `derecha` (por defecto) o `abajo`. Radial: no se usa. */
  direccion?: DireccionOrganizar;
  /**
   * Centra lo organizado en este punto (el esquema nuevo, que no tiene un sitio previo): en lugar de dejar fija la primera forma, la
   * caja de todo queda centrada ahí y, si hace falta, se traslada lo justo para entrar en la página con un margen (Y37b).
   */
  centro?: Punto;
}

export type MotivoOrganizar = "pocas" | "demasiadas" | "sin-cambios";

export interface ResultadoOrganizar {
  /** La misma escena (misma referencia) si no se organizó nada. */
  escena: Escena;
  motivo?: MotivoOrganizar;
  /** Se organizó, pero el resultado es más grande que la página y parte queda fuera (Y37b, DY66). No es un error. */
  aviso?: "fuera-de-pagina";
}

/** Separaciones de la disposición jerárquica: las mismas que usa el árbol, para que se vean parecidas. */
const SEPARACION_NIVELES = 80;
const SEPARACION_HERMANOS = 30;

/**
 * Qué tan apretada puede quedar una disposición para caber en la página (Y37b): la normal, una compacta y una más compacta. `hueco` es el
 * del radial (se mide entre los círculos que envuelven a cada nodo).
 */
const CALIDADES = [
  { niveles: SEPARACION_NIVELES, hermanos: SEPARACION_HERMANOS, hueco: 40 },
  { niveles: 50, hermanos: 20, hueco: 25 },
  { niveles: 30, hermanos: 12, hueco: 12 },
] as const;
/** Si las cajas ocupan más de esta parte del espacio útil de la página no se prueban las compactas (no cabrían): evita el costo con 500 formas. */
const SUPERFICIE_MAXIMA = 0.6;
/** Lo más que se acercan los centros del radial para que quepa (no se baja de ahí: se ve apretado). */
const COMPRESION_MINIMA = 0.55;

/**
 * Orden de lectura (Y37a, DY63): los hermanos van como ya están sobre el eje cruzado —de izquierda a derecha si el flujo es vertical, de
 * arriba abajo si es horizontal—, medido por el borde de entrada de cada caja. Un empate lo resuelve el orden de los conectores.
 */
const ordenDeLectura = (vertical: boolean) => (a: NodoDisposicion, b: NodoDisposicion): number => (vertical ? a.x - b.x : a.y - b.y);

const DIRECCION_DAGRE = { abajo: "TB", derecha: "LR", arriba: "BT", izquierda: "RL" } as const;

/** Dagre con el tamaño REAL de cada nodo (por defecto usaría uno solo para todos y los pisaría). */
export function posicionesDagre(
  nodos: readonly NodoDisposicion[],
  aristas: readonly AristaDisposicion[],
  direccion: DireccionOrganizar,
  separaciones: { niveles: number; hermanos: number } = { niveles: SEPARACION_NIVELES, hermanos: SEPARACION_HERMANOS },
): Posiciones {
  const graphNodes: GraphNode[] = nodos.map((n) => ({ id: n.id, x: n.x, y: n.y, meta: { ancho: n.ancho, alto: n.alto } }));
  const graphEdges: GraphEdge[] = aristas.map((a, i) => ({ id: `a${i}`, source: a.desde, target: a.hasta }));
  const colocados = computeDagreLayout(graphNodes, graphEdges, {
    direction: DIRECCION_DAGRE[direccion],
    rankSep: separaciones.niveles,
    nodeSep: separaciones.hermanos,
  });
  return new Map(colocados.map((n) => [n.id, { x: n.x, y: n.y }]));
}

/**
 * Organiza las formas elegidas (2 o más) o, sin ninguna elegida, todo el diagrama. Devuelve `motivo` si no se pudo:
 * `pocas` (menos de 2 formas que se puedan mover), `demasiadas` (más de 500) o `sin-cambios` (ya estaba así).
 */
export function organizarAuto(escena: Escena, ids: readonly string[], opciones: OpcionesOrganizar): ResultadoOrganizar {
  const grafo = extraerGrafo(escena, ids);
  if ("error" in grafo) return { escena, motivo: grafo.error };
  const { conectados } = separarSueltos(grafo);

  /** La disposición de lo conectado con la separación de la calidad `q` (0 = la normal). */
  const calcular = (q: number): Posiciones => {
    if (conectados.length === 0) return new Map();
    const c = CALIDADES[q] as (typeof CALIDADES)[number];
    if (opciones.modo === "radial") return disponerRadial(conectados, grafo.aristas, { separacion: c.hueco });
    if (opciones.modo === "arbol") {
      const orientacion = opciones.direccion === "abajo" ? "abajo" : "derecha";
      return disponerArbol(conectados, grafo.aristas, {
        orientacion,
        separacionNiveles: c.niveles,
        separacionHermanos: c.hermanos,
        alinear: "inicio",
        centrar: "hijos",
        ordenHermanos: ordenDeLectura(orientacion === "abajo"),
      });
    }
    const direccion = opciones.direccion ?? "abajo";
    // Un bosque (cada forma con un solo padre y sin ciclos) usa el motor de árbol: centrado, en orden de lectura y alineado por nivel
    // (DY64). Un flujo con uniones o ciclos sigue con dagre, que minimiza los cruces.
    if (esBosque(conectados, grafo.aristas)) {
      const vertical = direccion === "abajo" || direccion === "arriba";
      return disponerArbol(conectados, grafo.aristas, {
        orientacion: vertical ? "abajo" : "derecha",
        invertir: direccion === "arriba" || direccion === "izquierda",
        separacionNiveles: c.niveles,
        separacionHermanos: c.hermanos,
        alinear: "inicio",
        centrar: "hijos",
        ordenHermanos: ordenDeLectura(vertical),
      });
    }
    return posicionesDagre(conectados, grafo.aristas, direccion, { niveles: c.niveles, hermanos: c.hermanos });
  };

  // ─── Que quepa en la página (Y37b) ───
  // Se prueba, en orden, la disposición normal, una compacta, una más compacta y —solo el radial— la compactada con los centros más
  // juntos; gana la primera que cabe. Lo que ya cabía no se mueve. Si nada cabe se queda la normal y se avisa.
  const pagina: Pagina = { ancho: escena.ancho, alto: escena.alto };
  const margen = opciones.centro ? MARGEN_PAGINA : 0;
  const centrar = (posiciones: Posiciones): Posiciones => {
    const caja = cajaDeNodos(grafo.nodos, posiciones);
    if (!opciones.centro || !caja) return posiciones;
    const dx = opciones.centro.x - (caja.x + caja.ancho / 2);
    const dy = opciones.centro.y - (caja.y + caja.alto / 2);
    return new Map([...posiciones].map(([id, p]) => [id, { x: p.x + dx, y: p.y + dy }]));
  };
  const intentoDe = (q: number): Posiciones => centrar(componerPosiciones(grafo, calcular(q)));

  const normal = intentoDe(0);
  let elegido = trasladarAPagina(normal, grafo.nodos, pagina, margen);
  let ultimo = normal;
  const espacio = Math.max(0, pagina.ancho - 2 * margen) * Math.max(0, pagina.alto - 2 * margen);
  if (!elegido && superficieDeNodos(grafo.nodos) <= SUPERFICIE_MAXIMA * espacio) {
    for (let q = 1; q < CALIDADES.length && !elegido; q++) {
      ultimo = intentoDe(q);
      elegido = trasladarAPagina(ultimo, grafo.nodos, pagina, margen);
    }
    if (!elegido && opciones.modo === "radial") {
      const apretada = comprimirParaQueQuepa(ultimo, grafo.nodos, pagina, margen, COMPRESION_MINIMA);
      if (apretada && !hayPisadas(grafo.nodos, apretada)) elegido = trasladarAPagina(apretada, grafo.nodos, pagina, margen);
    }
  }
  const posiciones = elegido ?? normal;

  // Jerárquico y árbol fluyen en una dirección y sus conectores salen por ese lado; el radial no tiene una.
  const flujo = opciones.modo === "radial" ? undefined : opciones.modo === "arbol" ? (opciones.direccion === "abajo" ? "abajo" : "derecha") : (opciones.direccion ?? "abajo");
  const nueva = aplicarDisposicion(escena, grafo, posiciones, flujo ? { flujo } : {});
  if (nueva === escena) return { escena, motivo: "sin-cambios" };
  return elegido ? { escena: nueva } : { escena: nueva, aviso: "fuera-de-pagina" };
}

/**
 * Cuántas formas entrarían en la disposición, sin armar el grafo (se pregunta en cada pintado de la cinta, así que tiene
 * que ser barato): las elegidas con sus grupos abiertos o, sin elección, todas.
 */
export function formasAOrganizar(escena: Escena, seleccion: readonly string[]): number {
  if (seleccion.length === 0) return escena.elementos.filter((e) => e.tipo === "forma").length;
  const dentro = new Set<string>();
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const visitar = (id: string): void => {
    if (dentro.has(id)) return;
    dentro.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(visitar);
  };
  seleccion.forEach(visitar);
  return escena.elementos.filter((e) => e.tipo === "forma" && dentro.has(e.id)).length;
}

export const NOMBRE_MODO: Record<ModoOrganizar, string> = { jerarquico: "jerárquica", arbol: "en árbol", radial: "radial" };
