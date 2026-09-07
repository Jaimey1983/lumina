import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultGlobos } from "lumina-frontend/activities/globos";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  GlobosEditor,
  GlobosPropiedades,
  GlobosViewer,
} from "./globos-adapters.js";
import { GLOBOS_TIPO, type GlobosConfig, type GlobosEstado } from "./globos-types.js";

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
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: GlobosEstado, respuesta?: unknown) =>
    evaluarGlobos(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["globos"],
} as const satisfies ElementDefinition<GlobosEstado, GlobosConfig>;

export type GlobosDefinition = typeof globosDefinition;
