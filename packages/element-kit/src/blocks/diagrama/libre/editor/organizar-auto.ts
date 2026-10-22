// ─── Organizar automáticamente (Y13) ──────────────────────────────────────────
// Une el motor puro de `@lumina/drawing` (grafo, árbol, radial, cuadrícula, aplicar) con dagre, que vive en
// `@lumina/editor-shared` y por eso no puede estar en el paquete de dibujo.

import { computeDagreLayout, type GraphEdge, type GraphNode } from "@lumina/editor-shared/graph-editor";
import {
  aplicarDisposicion,
  componerPosiciones,
  disponerArbol,
  disponerRadial,
  extraerGrafo,
  separarSueltos,
  type AristaDisposicion,
  type Escena,
  type NodoDisposicion,
  type Posiciones,
} from "@lumina/drawing";

export type ModoOrganizar = "jerarquico" | "arbol" | "radial";
export type DireccionOrganizar = "abajo" | "derecha" | "arriba" | "izquierda";

export interface OpcionesOrganizar {
  modo: ModoOrganizar;
  /** Jerárquico: las cuatro. Árbol: `derecha` (por defecto) o `abajo`. Radial: no se usa. */
  direccion?: DireccionOrganizar;
}

export type MotivoOrganizar = "pocas" | "demasiadas" | "sin-cambios";

export interface ResultadoOrganizar {
  /** La misma escena (misma referencia) si no se organizó nada. */
  escena: Escena;
  motivo?: MotivoOrganizar;
}

/** Separaciones de la disposición jerárquica: las mismas que usa el árbol, para que se vean parecidas. */
const SEPARACION_NIVELES = 80;
const SEPARACION_HERMANOS = 30;

const DIRECCION_DAGRE = { abajo: "TB", derecha: "LR", arriba: "BT", izquierda: "RL" } as const;

/** Dagre con el tamaño REAL de cada nodo (por defecto usaría uno solo para todos y los pisaría). */
export function posicionesDagre(nodos: readonly NodoDisposicion[], aristas: readonly AristaDisposicion[], direccion: DireccionOrganizar): Posiciones {
  const graphNodes: GraphNode[] = nodos.map((n) => ({ id: n.id, x: n.x, y: n.y, meta: { ancho: n.ancho, alto: n.alto } }));
  const graphEdges: GraphEdge[] = aristas.map((a, i) => ({ id: `a${i}`, source: a.desde, target: a.hasta }));
  const colocados = computeDagreLayout(graphNodes, graphEdges, {
    direction: DIRECCION_DAGRE[direccion],
    rankSep: SEPARACION_NIVELES,
    nodeSep: SEPARACION_HERMANOS,
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
  let disposicion: Posiciones = new Map();
  if (conectados.length > 0) {
    if (opciones.modo === "radial") {
      disposicion = disponerRadial(conectados, grafo.aristas);
    } else if (opciones.modo === "arbol") {
      disposicion = disponerArbol(conectados, grafo.aristas, {
        orientacion: opciones.direccion === "abajo" ? "abajo" : "derecha",
        separacionNiveles: SEPARACION_NIVELES,
        separacionHermanos: SEPARACION_HERMANOS,
      });
    } else {
      disposicion = posicionesDagre(conectados, grafo.aristas, opciones.direccion ?? "abajo");
    }
  }
  // Jerárquico y árbol fluyen en una dirección y sus conectores salen por ese lado; el radial no tiene una.
  const flujo = opciones.modo === "radial" ? undefined : opciones.modo === "arbol" ? (opciones.direccion === "abajo" ? "abajo" : "derecha") : (opciones.direccion ?? "abajo");
  const nueva = aplicarDisposicion(escena, grafo, componerPosiciones(grafo, disposicion), flujo ? { flujo } : {});
  return nueva === escena ? { escena, motivo: "sin-cambios" } : { escena: nueva };
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
