import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultClasificar } from "lumina-frontend/activities/clasificar";
import type { ElementDefinition } from "../../contract.js";
import {
  ClasificarEditor,
  ClasificarPropiedades,
  ClasificarViewer,
} from "./clasificar-adapters.js";
import { CLASIFICAR_TIPO, type ClasificarConfig, type ClasificarEstado } from "./clasificar-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarClasificar(estado: ClasificarEstado, respuesta: unknown) {
  return evaluateActivityResponse("clasificar", estado, respuesta);
}

/** E2.4 — Clasificar como `ElementDefinition` evaluable. */
export const clasificarDefinition = {
  tipo: CLASIFICAR_TIPO,
  crearPorDefecto: () => createDefaultClasificar(),
  Editor: ClasificarEditor,
  Viewer: ClasificarViewer,
  Propiedades: ClasificarPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: ClasificarEstado, respuesta?: unknown) =>
    evaluarClasificar(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<ClasificarEstado, ClasificarConfig>;

export type ClasificarDefinition = typeof clasificarDefinition;
