import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultGlobos } from "../../activities/globos/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_GLOBOS } from "./globos-estilos.js";
import {
  GlobosEditor,
  GlobosPropiedades as GlobosPropiedadesBase,
  GlobosViewer,
} from "./globos-adapters.js";
import { GLOBOS_TIPO, type GlobosConfig, type GlobosEstado } from "./globos-types.js";

/** U9d.1: el panel suma estilos y ajustes comunes al panel de siempre. */
const GlobosPropiedades = crearPropiedadesConAjustes(GlobosPropiedadesBase, {
  presets: PRESETS_GLOBOS,
  storageKey: "actividad.globos.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarGlobos(estado: GlobosEstado, respuesta: unknown) {
  return evaluateActivityResponse("globos", estado, respuesta);
}

/** E2.4 — Globos como `ElementDefinition` evaluable. */
export const globosDefinition = {
  tipo: GLOBOS_TIPO,
  crearPorDefecto: () => createDefaultGlobos(),
  Editor: GlobosEditor,
  Viewer: GlobosViewer,
  Propiedades: GlobosPropiedades,
  // U9d.1: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_GLOBOS,
  puntuacion: (estado: GlobosEstado, respuesta?: unknown) =>
    evaluarGlobos(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["globos"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<GlobosEstado, GlobosConfig>;

export type GlobosDefinition = typeof globosDefinition;
