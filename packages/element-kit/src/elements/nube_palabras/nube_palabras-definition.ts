import { evaluateActivityResponse } from "@lumina/scoring";
import {
  wordCloudTemplate,
  WordCloudActivityEditor,
  WordCloudViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "../../contract.js";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  NUBE_PALABRAS_TIPO,
  type NubePalabrasConfig,
  type NubePalabrasEstado,
} from "./nube_palabras-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  NubePalabrasEstado,
  NubePalabrasConfig
>({
  Editor: WordCloudActivityEditor,
  viewer: { via: "component", Viewer: WordCloudViewer },
  editorNeedsSyncKey: true,
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
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: NubePalabrasEstado, respuesta?: unknown) =>
    evaluarNubePalabras(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<NubePalabrasEstado, NubePalabrasConfig>;

export type NubePalabrasDefinition = typeof nubePalabrasDefinition;
