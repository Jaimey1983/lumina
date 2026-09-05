import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultAbrirCaja } from "lumina-frontend/activities/abrir-caja";
import type { ElementDefinition } from "../../contract.js";
import {
  AbrirCajaEditor,
  AbrirCajaPropiedades,
  AbrirCajaViewer,
} from "./abrir_caja-adapters.js";
import { ABRIR_CAJA_TIPO, type AbrirCajaConfig, type AbrirCajaEstado } from "./abrir_caja-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarAbrirCaja(estado: AbrirCajaEstado, respuesta: unknown) {
  return evaluateActivityResponse("abrir_caja", estado, respuesta);
}

/** E2.4 — AbrirCaja como `ElementDefinition` evaluable. */
export const abrirCajaDefinition = {
  tipo: ABRIR_CAJA_TIPO,
  crearPorDefecto: () => createDefaultAbrirCaja(),
  Editor: AbrirCajaEditor,
  Viewer: AbrirCajaViewer,
  Propiedades: AbrirCajaPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: AbrirCajaEstado, respuesta?: unknown) =>
    evaluarAbrirCaja(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<AbrirCajaEstado, AbrirCajaConfig>;

export type AbrirCajaDefinition = typeof abrirCajaDefinition;
