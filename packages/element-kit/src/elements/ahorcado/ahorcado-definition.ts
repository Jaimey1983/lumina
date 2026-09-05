import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultAhorcado } from "lumina-frontend/activities/ahorcado";
import type { ElementDefinition } from "../../contract.js";
import {
  AhorcadoEditor,
  AhorcadoPropiedades,
  AhorcadoViewer,
} from "./ahorcado-adapters.js";
import { AHORCADO_TIPO, type AhorcadoConfig, type AhorcadoEstado } from "./ahorcado-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarAhorcado(estado: AhorcadoEstado, respuesta: unknown) {
  return evaluateActivityResponse("ahorcado", estado, respuesta);
}

/** E2.4 — Ahorcado como `ElementDefinition` evaluable. */
export const ahorcadoDefinition = {
  tipo: AHORCADO_TIPO,
  crearPorDefecto: () => createDefaultAhorcado(),
  Editor: AhorcadoEditor,
  Viewer: AhorcadoViewer,
  Propiedades: AhorcadoPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: AhorcadoEstado, respuesta?: unknown) =>
    evaluarAhorcado(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<AhorcadoEstado, AhorcadoConfig>;

export type AhorcadoDefinition = typeof ahorcadoDefinition;
