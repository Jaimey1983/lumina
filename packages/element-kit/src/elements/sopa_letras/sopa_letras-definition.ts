import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultSopaLetras } from "lumina-frontend/activities/sopa-letras";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  SopaLetrasEditor,
  SopaLetrasPropiedades,
  SopaLetrasViewer,
} from "./sopa_letras-adapters.js";
import { SOPA_LETRAS_TIPO, type SopaLetrasConfig, type SopaLetrasEstado } from "./sopa_letras-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarSopaLetras(estado: SopaLetrasEstado, respuesta: unknown) {
  return evaluateActivityResponse("sopa_letras", estado, respuesta);
}

/** E2.4 — SopaLetras como `ElementDefinition` evaluable. */
export const sopaLetrasDefinition = {
  tipo: SOPA_LETRAS_TIPO,
  crearPorDefecto: () => createDefaultSopaLetras(),
  Editor: SopaLetrasEditor,
  Viewer: SopaLetrasViewer,
  Propiedades: SopaLetrasPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: SopaLetrasEstado, respuesta?: unknown) =>
    evaluarSopaLetras(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["sopa_letras"],
} as const satisfies ElementDefinition<SopaLetrasEstado, SopaLetrasConfig>;

export type SopaLetrasDefinition = typeof sopaLetrasDefinition;
