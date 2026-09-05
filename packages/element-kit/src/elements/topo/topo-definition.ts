import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultTopo } from "lumina-frontend/activities/topo";
import type { ElementDefinition } from "../../contract.js";
import {
  TopoEditor,
  TopoPropiedades,
  TopoViewer,
} from "./topo-adapters.js";
import { TOPO_TIPO, type TopoConfig, type TopoEstado } from "./topo-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarTopo(estado: TopoEstado, respuesta: unknown) {
  return evaluateActivityResponse("topo", estado, respuesta);
}

/** E2.4 — Topo como `ElementDefinition` evaluable. */
export const topoDefinition = {
  tipo: TOPO_TIPO,
  crearPorDefecto: () => createDefaultTopo(),
  Editor: TopoEditor,
  Viewer: TopoViewer,
  Propiedades: TopoPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: TopoEstado, respuesta?: unknown) =>
    evaluarTopo(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<TopoEstado, TopoConfig>;

export type TopoDefinition = typeof topoDefinition;
