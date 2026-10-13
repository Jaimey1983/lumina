import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  wordCloudTemplate,
  WordCloudActivityEditor,
  WordCloudViewer,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_NUBE_PALABRAS } from "./nube_palabras-estilos.js";
import {
  NUBE_PALABRAS_TIPO,
  type NubePalabrasConfig,
  type NubePalabrasEstado,
} from "./nube_palabras-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  NubePalabrasEstado,
  NubePalabrasConfig
>({
  Editor: WordCloudActivityEditor,
  viewer: { via: "component", Viewer: WordCloudViewer },
  editorNeedsSyncKey: true,
});

/** U9a.5: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_NUBE_PALABRAS,
  storageKey: "actividad.nube_palabras.estilos",
});

export {
  Editor as NubePalabrasEditor,
  Viewer as NubePalabrasViewer,
  Propiedades as NubePalabrasPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarNubePalabras(estado: NubePalabrasEstado, respuesta: unknown) {
  return evaluateActivityResponse("nube_palabras", estado, respuesta);
}

/** E2.5 — nube_palabras (familia clásica) como `ElementDefinition`. */
export const nubePalabrasDefinition = {
  tipo: NUBE_PALABRAS_TIPO,
  crearPorDefecto: () => wordCloudTemplate() as NubePalabrasEstado,
  Editor,
  Viewer,
  Propiedades,
  // U9a.5: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_NUBE_PALABRAS,
  puntuacion: (estado: NubePalabrasEstado, respuesta?: unknown) =>
    evaluarNubePalabras(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["nube_palabras"],
} as const satisfies ElementDefinition<NubePalabrasEstado, NubePalabrasConfig>;

export type NubePalabrasDefinition = typeof nubePalabrasDefinition;
