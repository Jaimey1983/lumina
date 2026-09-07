import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  dragDropTemplate,
  DragDropActivityEditor,
  DragDropActivity,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  ARRASTRAR_SOLTAR_TIPO,
  type ArrastrarSoltarConfig,
  type ArrastrarSoltarEstado,
} from "./arrastrar_soltar-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  ArrastrarSoltarEstado,
  ArrastrarSoltarConfig
>({
  Editor: DragDropActivityEditor,
  viewer: { via: "modo", Activity: DragDropActivity },
  editorNeedsSyncKey: true,
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
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: ArrastrarSoltarEstado, respuesta?: unknown) =>
    evaluarArrastrarSoltar(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["arrastrar_soltar"],
} as const satisfies ElementDefinition<ArrastrarSoltarEstado, ArrastrarSoltarConfig>;

export type ArrastrarSoltarDefinition = typeof arrastrarSoltarDefinition;
