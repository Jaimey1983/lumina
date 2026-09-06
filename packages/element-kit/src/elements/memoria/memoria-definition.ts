import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultMemoria } from "lumina-frontend/activities/memoria";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  MemoriaEditor,
  MemoriaPropiedades,
  MemoriaViewer,
} from "./memoria-adapters.js";
import { MEMORIA_TIPO, type MemoriaConfig, type MemoriaEstado } from "./memoria-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarMemoria(estado: MemoriaEstado, respuesta: unknown) {
  return evaluateActivityResponse("memoria", estado, respuesta);
}

/** E2.4 — Memoria como `ElementDefinition` evaluable. */
export const memoriaDefinition = {
  tipo: MEMORIA_TIPO,
  crearPorDefecto: () => createDefaultMemoria(),
  Editor: MemoriaEditor,
  Viewer: MemoriaViewer,
  Propiedades: MemoriaPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: MemoriaEstado, respuesta?: unknown) =>
    evaluarMemoria(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<MemoriaEstado, MemoriaConfig>;

export type MemoriaDefinition = typeof memoriaDefinition;
