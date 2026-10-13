import { evaluateActivityResponse } from "@lumina/scoring";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultClozeBanco } from "../../activities/cloze-banco/index.js";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import {
  ClozeBancoEditor,
  ClozeBancoPropiedades as PropiedadesBase,
  ClozeBancoViewer,
} from "./cloze_banco-adapters.js";
import { PRESETS_CLOZE_BANCO } from "./cloze_banco-estilos.js";
import {
  CLOZE_BANCO_TIPO,
  type ClozeBancoConfig,
  type ClozeBancoEstado,
} from "./cloze_banco-types.js";

/** El panel suma estilos, ajustes comunes y el panel de producción (U12) al editor de siempre. */
const ClozeBancoPropiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_CLOZE_BANCO,
  storageKey: "actividad.cloze_banco.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarClozeBanco(estado: ClozeBancoEstado, respuesta: unknown) {
  return evaluateActivityResponse("cloze_banco", estado, respuesta);
}

/** U18 — Cloze con banco como `ElementDefinition` evaluable (scoring `partial`). */
export const clozeBancoDefinition = {
  tipo: CLOZE_BANCO_TIPO,
  crearPorDefecto: () => createDefaultClozeBanco(),
  Editor: ClozeBancoEditor,
  Viewer: ClozeBancoViewer,
  Propiedades: ClozeBancoPropiedades,
  // El estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento propio.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_CLOZE_BANCO,
  puntuacion: (estado: ClozeBancoEstado, respuesta?: unknown) =>
    evaluarClozeBanco(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["cloze_banco"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<ClozeBancoEstado, ClozeBancoConfig>;

export type ClozeBancoDefinition = typeof clozeBancoDefinition;
