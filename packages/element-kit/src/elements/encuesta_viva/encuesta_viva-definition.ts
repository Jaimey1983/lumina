import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  livePollTemplate,
  LivePollActivityEditor,
  LivePollViewer,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_ENCUESTA_VIVA } from "./encuesta_viva-estilos.js";
import {
  ENCUESTA_VIVA_TIPO,
  type EncuestaVivaConfig,
  type EncuestaVivaEstado,
} from "./encuesta_viva-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  EncuestaVivaEstado,
  EncuestaVivaConfig
>({
  Editor: LivePollActivityEditor,
  viewer: { via: "component", Viewer: LivePollViewer },
  editorNeedsSyncKey: true,
});

/** U9a.4: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_ENCUESTA_VIVA,
  storageKey: "actividad.encuesta_viva.estilos",
});

export {
  Editor as EncuestaVivaEditor,
  Viewer as EncuestaVivaViewer,
  Propiedades as EncuestaVivaPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarEncuestaViva(estado: EncuestaVivaEstado, respuesta: unknown) {
  return evaluateActivityResponse("encuesta_viva", estado, respuesta);
}

/** E2.5 — encuesta_viva (familia clásica) como `ElementDefinition`. */
export const encuestaVivaDefinition = {
  tipo: ENCUESTA_VIVA_TIPO,
  crearPorDefecto: () => livePollTemplate() as EncuestaVivaEstado,
  Editor,
  Viewer,
  Propiedades,
  // U9a.4: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_ENCUESTA_VIVA,
  puntuacion: (estado: EncuestaVivaEstado, respuesta?: unknown) =>
    evaluarEncuestaViva(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["encuesta_viva"],
} as const satisfies ElementDefinition<EncuestaVivaEstado, EncuestaVivaConfig>;

export type EncuestaVivaDefinition = typeof encuestaVivaDefinition;
