import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultCrucigrama } from "../../activities/crucigrama/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_CRUCIGRAMA } from "./crucigrama-estilos.js";
import {
  CrucigramaEditor,
  CrucigramaPropiedades as CrucigramaPropiedadesBase,
  CrucigramaViewer,
} from "./crucigrama-adapters.js";
import { CRUCIGRAMA_TIPO, type CrucigramaConfig, type CrucigramaEstado } from "./crucigrama-types.js";

/** U9c.3: el panel suma estilos y ajustes comunes al panel de siempre. */
const CrucigramaPropiedades = crearPropiedadesConAjustes(CrucigramaPropiedadesBase, {
  presets: PRESETS_CRUCIGRAMA,
  storageKey: "actividad.crucigrama.estilos",
});

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
  // U9c.3: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_CRUCIGRAMA,
  puntuacion: (estado: CrucigramaEstado, respuesta?: unknown) =>
    evaluarCrucigrama(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["crucigrama"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<CrucigramaEstado, CrucigramaConfig>;

export type CrucigramaDefinition = typeof crucigramaDefinition;
