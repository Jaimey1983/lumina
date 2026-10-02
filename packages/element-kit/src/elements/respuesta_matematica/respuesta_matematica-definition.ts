import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  respuestaMatematicaTemplate,
  RespuestaMatematicaEditor as RespuestaMatematicaEditorLegacy,
  RespuestaMatematicaViewer as RespuestaMatematicaViewerLegacy,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  RESPUESTA_MATEMATICA_TIPO,
  type RespuestaMatematicaConfig,
  type RespuestaMatematicaEstado,
} from "./respuesta_matematica-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  RespuestaMatematicaEstado,
  RespuestaMatematicaConfig
>({
  Editor: RespuestaMatematicaEditorLegacy,
  viewer: { via: "component", Viewer: RespuestaMatematicaViewerLegacy },
  editorNeedsSyncKey: true,
});

export {
  Editor as RespuestaMatematicaEditor,
  Viewer as RespuestaMatematicaViewer,
  Propiedades as RespuestaMatematicaPropiedades,
};

/** Delegado puro a `@lumina/scoring` (clase `binary`). */
export function evaluarRespuestaMatematica(
  estado: RespuestaMatematicaEstado,
  respuesta: unknown,
) {
  return evaluateActivityResponse("respuesta_matematica", estado, respuesta);
}

/** Etapa M / M3a — respuesta numérica autocalificable como `ElementDefinition`. */
export const respuestaMatematicaDefinition = {
  tipo: RESPUESTA_MATEMATICA_TIPO,
  crearPorDefecto: () => respuestaMatematicaTemplate() as RespuestaMatematicaEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: RespuestaMatematicaEstado, respuesta?: unknown) =>
    evaluarRespuestaMatematica(estado, respuesta).score ?? 0,
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
  catalogo: CATALOGO_ELEMENTOS["respuesta_matematica"],
} as const satisfies ElementDefinition<
  RespuestaMatematicaEstado,
  RespuestaMatematicaConfig
>;

export type RespuestaMatematicaDefinition = typeof respuestaMatematicaDefinition;
