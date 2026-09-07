import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  orderStepsTemplate,
  OrderStepsActivityEditor,
  OrderStepsViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  ORDENAR_PASOS_TIPO,
  type OrdenarPasosConfig,
  type OrdenarPasosEstado,
} from "./ordenar_pasos-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  OrdenarPasosEstado,
  OrdenarPasosConfig
>({
  Editor: OrderStepsActivityEditor,
  viewer: { via: "component", Viewer: OrderStepsViewer },
  editorNeedsSyncKey: true,
});

export {
  Editor as OrdenarPasosEditor,
  Viewer as OrdenarPasosViewer,
  Propiedades as OrdenarPasosPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarOrdenarPasos(estado: OrdenarPasosEstado, respuesta: unknown) {
  return evaluateActivityResponse("ordenar_pasos", estado, respuesta);
}

/** E2.5 — ordenar_pasos (familia clásica) como `ElementDefinition`. */
export const ordenarPasosDefinition = {
  tipo: ORDENAR_PASOS_TIPO,
  crearPorDefecto: () => orderStepsTemplate() as OrdenarPasosEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: OrdenarPasosEstado, respuesta?: unknown) =>
    evaluarOrdenarPasos(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["ordenar_pasos"],
} as const satisfies ElementDefinition<OrdenarPasosEstado, OrdenarPasosConfig>;

export type OrdenarPasosDefinition = typeof ordenarPasosDefinition;
