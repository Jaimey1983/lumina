import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultCrucigrama } from "lumina-frontend/activities/crucigrama";
import type { ElementDefinition } from "../../contract.js";
import {
  CrucigramaEditor,
  CrucigramaPropiedades,
  CrucigramaViewer,
} from "./crucigrama-adapters.js";
import { CRUCIGRAMA_TIPO, type CrucigramaConfig, type CrucigramaEstado } from "./crucigrama-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarCrucigrama(estado: CrucigramaEstado, respuesta: unknown) {
  return evaluateActivityResponse("crucigrama", estado, respuesta);
}

/** E2.4 — Crucigrama como `ElementDefinition` evaluable. */
export const crucigramaDefinition = {
  tipo: CRUCIGRAMA_TIPO,
  crearPorDefecto: () => createDefaultCrucigrama(),
  Editor: CrucigramaEditor,
  Viewer: CrucigramaViewer,
  Propiedades: CrucigramaPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: CrucigramaEstado, respuesta?: unknown) =>
    evaluarCrucigrama(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<CrucigramaEstado, CrucigramaConfig>;

export type CrucigramaDefinition = typeof crucigramaDefinition;
