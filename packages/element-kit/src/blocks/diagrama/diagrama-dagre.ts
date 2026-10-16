// ─── Layout jerárquico (dagre) sobre nodos/aristas de un diagrama ─────────────
// Única implementación del patrón «nodos → GraphNode → dagre → posiciones»
// que antes estaba copiada en `diagrama-properties.tsx` (cambio de subtipo,
// «Auto-Organizar» y esquema por sangría).

import type { DiagramaArista, DiagramaNodo, DiagramaOpciones, DiagramaSubtipo } from '@lumina/types/slide';
import {
  computeDagreLayout,
  type DagreLayoutOptions,
  type GraphEdge,
  type GraphNode,
} from '@lumina/editor-shared/graph-editor';
import { layoutRadial } from './layout-pedagogico.js';

/**
 * Devuelve `nodos` con `x`/`y` recalculadas por dagre (dirección `TB` por
 * defecto). No toca el resto de campos del nodo ni reordena el arreglo; un
 * nodo que dagre no devuelve conserva su posición.
 */
export function aplicarDagre(
  nodos: DiagramaNodo[],
  aristas: DiagramaArista[],
  opts: DagreLayoutOptions = { direction: 'TB' },
): DiagramaNodo[] {
  const graphNodes: GraphNode[] = nodos.map((n) => ({ id: n.id, x: n.x, y: n.y }));
  const graphEdges: GraphEdge[] = aristas.map((a) => ({
    id: a.id,
    source: a.desdeId,
    target: a.haciaId,
  }));

  const posMap = new Map(computeDagreLayout(graphNodes, graphEdges, opts).map((l) => [l.id, l]));
  return nodos.map((n) => {
    const p = posMap.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}

// ─── Dirección y densidad (opciones.direccionLayout / opciones.densidad) ──────

export type DireccionLayout = NonNullable<DiagramaOpciones['direccionLayout']>;
export type DensidadLayout = NonNullable<DiagramaOpciones['densidad']>;

/** Subtipos con disposición propia: ignoran dirección y densidad. */
export const SUBTIPOS_LAYOUT_PROPIO: readonly DiagramaSubtipo[] = ['piramide', 'embudo', 'cebolla', 'cronologia'];

export function tieneLayoutPropio(subtipo: DiagramaSubtipo): boolean {
  return SUBTIPOS_LAYOUT_PROPIO.includes(subtipo);
}

/** Separación entre rangos/nodos para cada densidad; `normal` es la de siempre (60/40). */
export const SEPARACION_POR_DENSIDAD: Record<DensidadLayout, { rankSep: number; nodeSep: number }> = {
  compacta: { rankSep: 36, nodeSep: 24 },
  normal: { rankSep: 60, nodeSep: 40 },
  amplia: { rankSep: 96, nodeSep: 64 },
};

/** Dirección efectiva: la elegida o, si no hay, radial para el mapa mental y arriba→abajo para el resto. */
export function resolverDireccion(opciones: DiagramaOpciones | undefined, subtipo: DiagramaSubtipo): DireccionLayout {
  return opciones?.direccionLayout ?? (subtipo === 'mapa_mental' ? 'radial' : 'TB');
}

export function resolverDensidad(opciones: DiagramaOpciones | undefined): DensidadLayout {
  return opciones?.densidad ?? 'normal';
}

/**
 * Coloca nodos de un grafo según las opciones del diagrama: `radial` delega en
 * `layoutRadial`; `TB`/`BT`/`LR`/`RL` en dagre con la separación de la densidad.
 * No sirve para los subtipos con disposición propia (ver `tieneLayoutPropio`).
 */
export function organizarGrafo(
  nodos: DiagramaNodo[],
  aristas: DiagramaArista[],
  subtipo: DiagramaSubtipo,
  opciones: DiagramaOpciones | undefined,
): DiagramaNodo[] {
  const direccion = resolverDireccion(opciones, subtipo);
  if (direccion === 'radial') return layoutRadial(nodos, aristas);
  return aplicarDagre(nodos, aristas, {
    direction: direccion,
    ...SEPARACION_POR_DENSIDAD[resolverDensidad(opciones)],
  });
}
