import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultSopaLetras } from "../../activities/sopa-letras/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_SOPA_LETRAS } from "./sopa_letras-estilos.js";
import {
  SopaLetrasEditor,
  SopaLetrasPropiedades as SopaLetrasPropiedadesBase,
  SopaLetrasViewer,
} from "./sopa_letras-adapters.js";
import { SOPA_LETRAS_TIPO, type SopaLetrasConfig, type SopaLetrasEstado } from "./sopa_letras-types.js";

/** U9c.4: el panel suma estilos y ajustes comunes al panel de siempre. */
const SopaLetrasPropiedades = crearPropiedadesConAjustes(SopaLetrasPropiedadesBase, {
  presets: PRESETS_SOPA_LETRAS,
  storageKey: "actividad.sopa_letras.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarSopaLetras(estado: SopaLetrasEstado, respuesta: unknown) {
  return evaluateActivityResponse("sopa_letras", estado, respuesta);
}

/** E2.4 — SopaLetras como `ElementDefinition` evaluable. */
export const sopaLetrasDefinition = {
  tipo: SOPA_LETRAS_TIPO,
  crearPorDefecto: () => createDefaultSopaLetras(),
  Editor: SopaLetrasEditor,
  Viewer: SopaLetrasViewer,
  Propiedades: SopaLetrasPropiedades,
  // U9c.4: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_SOPA_LETRAS,
  puntuacion: (estado: SopaLetrasEstado, respuesta?: unknown) =>
    evaluarSopaLetras(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["sopa_letras"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<SopaLetrasEstado, SopaLetrasConfig>;

export type SopaLetrasDefinition = typeof sopaLetrasDefinition;
