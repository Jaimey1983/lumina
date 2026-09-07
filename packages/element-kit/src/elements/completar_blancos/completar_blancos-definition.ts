import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  fillBlanksTemplate,
  FillBlanksActivityEditor,
  FillBlanksViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  COMPLETAR_BLANCOS_TIPO,
  type CompletarBlancosConfig,
  type CompletarBlancosEstado,
} from "./completar_blancos-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  CompletarBlancosEstado,
  CompletarBlancosConfig
>({
  Editor: FillBlanksActivityEditor,
  viewer: { via: "component", Viewer: FillBlanksViewer },
  editorNeedsSyncKey: true,
});

export {
  Editor as CompletarBlancosEditor,
  Viewer as CompletarBlancosViewer,
  Propiedades as CompletarBlancosPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarCompletarBlancos(estado: CompletarBlancosEstado, respuesta: unknown) {
  return evaluateActivityResponse("completar_blancos", estado, respuesta);
}

/** E2.5 — completar_blancos (familia clásica) como `ElementDefinition`. */
export const completarBlancosDefinition = {
  tipo: COMPLETAR_BLANCOS_TIPO,
  crearPorDefecto: () => fillBlanksTemplate() as CompletarBlancosEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: CompletarBlancosEstado, respuesta?: unknown) =>
    evaluarCompletarBlancos(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["completar_blancos"],
} as const satisfies ElementDefinition<CompletarBlancosEstado, CompletarBlancosConfig>;

export type CompletarBlancosDefinition = typeof completarBlancosDefinition;
