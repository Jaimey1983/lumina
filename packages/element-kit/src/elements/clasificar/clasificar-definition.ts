import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultClasificar } from "../../activities/clasificar/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_CLASIFICAR } from "./clasificar-estilos.js";
import {
  ClasificarEditor,
  ClasificarPropiedades as ClasificarPropiedadesBase,
  ClasificarViewer,
} from "./clasificar-adapters.js";
import { CLASIFICAR_TIPO, type ClasificarConfig, type ClasificarEstado } from "./clasificar-types.js";

/** U9b.2: el panel suma estilos y ajustes comunes al panel de siempre (categorías y piezas). */
const ClasificarPropiedades = crearPropiedadesConAjustes(ClasificarPropiedadesBase, {
  presets: PRESETS_CLASIFICAR,
  storageKey: "actividad.clasificar.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarClasificar(estado: ClasificarEstado, respuesta: unknown) {
  return evaluateActivityResponse("clasificar", estado, respuesta);
}

/** E2.4 — Clasificar como `ElementDefinition` evaluable. */
export const clasificarDefinition = {
  tipo: CLASIFICAR_TIPO,
  crearPorDefecto: () => createDefaultClasificar(),
  Editor: ClasificarEditor,
  Viewer: ClasificarViewer,
  Propiedades: ClasificarPropiedades,
  // U9b.2: el estilo (`ajustes.estilo`) es color; los colores de categoría son datos del editor.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_CLASIFICAR,
  puntuacion: (estado: ClasificarEstado, respuesta?: unknown) =>
    evaluarClasificar(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["clasificar"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<ClasificarEstado, ClasificarConfig>;

export type ClasificarDefinition = typeof clasificarDefinition;
