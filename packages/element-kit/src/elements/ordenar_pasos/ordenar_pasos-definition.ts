import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  orderStepsTemplate,
  OrderStepsActivityEditor,
  OrderStepsViewer,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_ORDENAR_PASOS } from "./ordenar_pasos-estilos.js";
import {
  ORDENAR_PASOS_TIPO,
  type OrdenarPasosConfig,
  type OrdenarPasosEstado,
} from "./ordenar_pasos-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  OrdenarPasosEstado,
  OrdenarPasosConfig
>({
  Editor: OrderStepsActivityEditor,
  viewer: { via: "component", Viewer: OrderStepsViewer },
  editorNeedsSyncKey: true,
});

/** U9b.4: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_ORDENAR_PASOS,
  storageKey: "actividad.ordenar_pasos.estilos",
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
  // U9b.4: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_ORDENAR_PASOS,
  puntuacion: (estado: OrdenarPasosEstado, respuesta?: unknown) =>
    evaluarOrdenarPasos(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["ordenar_pasos"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<OrdenarPasosEstado, OrdenarPasosConfig>;

export type OrdenarPasosDefinition = typeof ordenarPasosDefinition;
