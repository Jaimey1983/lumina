import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  matchPairsTemplate,
  EmparejarEditor,
  EmparejarViewer,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_EMPAREJAR } from "./emparejar-estilos.js";
import {
  EMPAREJAR_TIPO,
  type EmparejarConfig,
  type EmparejarEstado,
} from "./emparejar-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  EmparejarEstado,
  EmparejarConfig
>({
  Editor: EmparejarEditor,
  viewer: { via: "component", Viewer: EmparejarViewer },
  actividadProp: "actividad",
});

/** U9b.3: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_EMPAREJAR,
  storageKey: "actividad.emparejar.estilos",
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
  // U9b.3: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_EMPAREJAR,
  puntuacion: (estado: EmparejarEstado, respuesta?: unknown) =>
    evaluarEmparejar(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["emparejar"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<EmparejarEstado, EmparejarConfig>;

export type EmparejarDefinition = typeof emparejarDefinition;
