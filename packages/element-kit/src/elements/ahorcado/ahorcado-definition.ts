import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultAhorcado } from "../../activities/ahorcado/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_AHORCADO } from "./ahorcado-estilos.js";
import {
  AhorcadoEditor,
  AhorcadoPropiedades as AhorcadoPropiedadesBase,
  AhorcadoViewer,
} from "./ahorcado-adapters.js";
import { AHORCADO_TIPO, type AhorcadoConfig, type AhorcadoEstado } from "./ahorcado-types.js";

/** U9c.1: el panel suma estilos y ajustes comunes al panel de siempre. */
const AhorcadoPropiedades = crearPropiedadesConAjustes(AhorcadoPropiedadesBase, {
  presets: PRESETS_AHORCADO,
  storageKey: "actividad.ahorcado.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarAhorcado(estado: AhorcadoEstado, respuesta: unknown) {
  return evaluateActivityResponse("ahorcado", estado, respuesta);
}

/** E2.4 — Ahorcado como `ElementDefinition` evaluable. */
export const ahorcadoDefinition = {
  tipo: AHORCADO_TIPO,
  crearPorDefecto: () => createDefaultAhorcado(),
  Editor: AhorcadoEditor,
  Viewer: AhorcadoViewer,
  Propiedades: AhorcadoPropiedades,
  // U9c.1: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_AHORCADO,
  puntuacion: (estado: AhorcadoEstado, respuesta?: unknown) =>
    evaluarAhorcado(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["ahorcado"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<AhorcadoEstado, AhorcadoConfig>;

export type AhorcadoDefinition = typeof ahorcadoDefinition;
