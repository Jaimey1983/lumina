import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultTopo } from "../../activities/topo/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_TOPO } from "./topo-estilos.js";
import {
  TopoEditor,
  TopoPropiedades as TopoPropiedadesBase,
  TopoViewer,
} from "./topo-adapters.js";
import { TOPO_TIPO, type TopoConfig, type TopoEstado } from "./topo-types.js";

/** U9d.2: el panel suma estilos y ajustes comunes al panel de siempre. */
const TopoPropiedades = crearPropiedadesConAjustes(TopoPropiedadesBase, {
  presets: PRESETS_TOPO,
  storageKey: "actividad.topo.estilos",
});

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
  // U9d.2: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_TOPO,
  puntuacion: (estado: TopoEstado, respuesta?: unknown) =>
    evaluarTopo(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["topo"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<TopoEstado, TopoConfig>;

export type TopoDefinition = typeof topoDefinition;
