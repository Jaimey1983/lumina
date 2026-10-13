import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  dragDropTemplate,
  DragDropActivityEditor,
  DragDropActivity,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_ARRASTRAR_SOLTAR } from "./arrastrar_soltar-estilos.js";
import {
  ARRASTRAR_SOLTAR_TIPO,
  type ArrastrarSoltarConfig,
  type ArrastrarSoltarEstado,
} from "./arrastrar_soltar-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  ArrastrarSoltarEstado,
  ArrastrarSoltarConfig
>({
  Editor: DragDropActivityEditor,
  viewer: { via: "modo", Activity: DragDropActivity },
  editorNeedsSyncKey: true,
});

/** U9b.6: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_ARRASTRAR_SOLTAR,
  storageKey: "actividad.arrastrar_soltar.estilos",
});

export {
  Editor as ArrastrarSoltarEditor,
  Viewer as ArrastrarSoltarViewer,
  Propiedades as ArrastrarSoltarPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarArrastrarSoltar(estado: ArrastrarSoltarEstado, respuesta: unknown) {
  return evaluateActivityResponse("arrastrar_soltar", estado, respuesta);
}

/** E2.5 — arrastrar_soltar (familia clásica) como `ElementDefinition`. */
export const arrastrarSoltarDefinition = {
  tipo: ARRASTRAR_SOLTAR_TIPO,
  crearPorDefecto: () => dragDropTemplate() as ArrastrarSoltarEstado,
  Editor,
  Viewer,
  Propiedades,
  // U9b.6: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_ARRASTRAR_SOLTAR,
  puntuacion: (estado: ArrastrarSoltarEstado, respuesta?: unknown) =>
    evaluarArrastrarSoltar(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["arrastrar_soltar"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<ArrastrarSoltarEstado, ArrastrarSoltarConfig>;

export type ArrastrarSoltarDefinition = typeof arrastrarSoltarDefinition;
