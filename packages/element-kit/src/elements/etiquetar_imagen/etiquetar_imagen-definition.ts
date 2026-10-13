import { evaluateActivityResponse } from "@lumina/scoring";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultEtiquetarImagen } from "../../activities/etiquetar-imagen/index.js";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import {
  EtiquetarImagenEditor,
  EtiquetarImagenPropiedades as PropiedadesBase,
  EtiquetarImagenViewer,
} from "./etiquetar_imagen-adapters.js";
import { PRESETS_ETIQUETAR_IMAGEN } from "./etiquetar_imagen-estilos.js";
import {
  ETIQUETAR_IMAGEN_TIPO,
  type EtiquetarImagenConfig,
  type EtiquetarImagenEstado,
} from "./etiquetar_imagen-types.js";

/** El panel suma estilos, ajustes comunes y el panel de producción (U12) al editor de siempre. */
const EtiquetarImagenPropiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_ETIQUETAR_IMAGEN,
  storageKey: "actividad.etiquetar_imagen.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarEtiquetarImagen(estado: EtiquetarImagenEstado, respuesta: unknown) {
  return evaluateActivityResponse("etiquetar_imagen", estado, respuesta);
}

/** U16 — Etiquetar imagen como `ElementDefinition` evaluable (scoring `partial`). */
export const etiquetarImagenDefinition = {
  tipo: ETIQUETAR_IMAGEN_TIPO,
  crearPorDefecto: () => createDefaultEtiquetarImagen(),
  Editor: EtiquetarImagenEditor,
  Viewer: EtiquetarImagenViewer,
  Propiedades: EtiquetarImagenPropiedades,
  // El estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento propio.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_ETIQUETAR_IMAGEN,
  puntuacion: (estado: EtiquetarImagenEstado, respuesta?: unknown) =>
    evaluarEtiquetarImagen(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["etiquetar_imagen"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<EtiquetarImagenEstado, EtiquetarImagenConfig>;

export type EtiquetarImagenDefinition = typeof etiquetarImagenDefinition;
