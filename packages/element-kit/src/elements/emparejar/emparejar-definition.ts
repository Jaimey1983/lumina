import { evaluateActivityResponse } from "@lumina/scoring";
import {
  matchPairsTemplate,
  EmparejarEditor,
  EmparejarViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "../../contract.js";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  EMPAREJAR_TIPO,
  type EmparejarConfig,
  type EmparejarEstado,
} from "./emparejar-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  EmparejarEstado,
  EmparejarConfig
>({
  Editor: EmparejarEditor,
  viewer: { via: "component", Viewer: EmparejarViewer },
  actividadProp: "actividad",
});

export {
  Editor as EmparejarEditor,
  Viewer as EmparejarViewer,
  Propiedades as EmparejarPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarEmparejar(estado: EmparejarEstado, respuesta: unknown) {
  return evaluateActivityResponse("emparejar", estado, respuesta);
}

/** E2.5 — emparejar (familia clásica) como `ElementDefinition`. */
export const emparejarDefinition = {
  tipo: EMPAREJAR_TIPO,
  crearPorDefecto: () => matchPairsTemplate() as EmparejarEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: EmparejarEstado, respuesta?: unknown) =>
    evaluarEmparejar(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<EmparejarEstado, EmparejarConfig>;

export type EmparejarDefinition = typeof emparejarDefinition;
