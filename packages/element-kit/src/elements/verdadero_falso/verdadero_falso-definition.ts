import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  trueFalseTemplate,
  TrueFalseActivityEditor,
  TrueFalseViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  VERDADERO_FALSO_TIPO,
  type VerdaderoFalsoConfig,
  type VerdaderoFalsoEstado,
} from "./verdadero_falso-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  VerdaderoFalsoEstado,
  VerdaderoFalsoConfig
>({
  Editor: TrueFalseActivityEditor,
  viewer: { via: "component", Viewer: TrueFalseViewer },
  editorNeedsSyncKey: true,
});

export {
  Editor as VerdaderoFalsoEditor,
  Viewer as VerdaderoFalsoViewer,
  Propiedades as VerdaderoFalsoPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarVerdaderoFalso(estado: VerdaderoFalsoEstado, respuesta: unknown) {
  return evaluateActivityResponse("verdadero_falso", estado, respuesta);
}

/** E2.5 — verdadero_falso (familia clásica) como `ElementDefinition`. */
export const verdaderoFalsoDefinition = {
  tipo: VERDADERO_FALSO_TIPO,
  crearPorDefecto: () => trueFalseTemplate() as VerdaderoFalsoEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: VerdaderoFalsoEstado, respuesta?: unknown) =>
    evaluarVerdaderoFalso(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["verdadero_falso"],
} as const satisfies ElementDefinition<VerdaderoFalsoEstado, VerdaderoFalsoConfig>;

export type VerdaderoFalsoDefinition = typeof verdaderoFalsoDefinition;
