import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultAbrirCaja } from "../../activities/abrir-caja/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_ABRIR_CAJA } from "./abrir_caja-estilos.js";
import {
  AbrirCajaEditor,
  AbrirCajaPropiedades as AbrirCajaPropiedadesBase,
  AbrirCajaViewer,
} from "./abrir_caja-adapters.js";
import { ABRIR_CAJA_TIPO, type AbrirCajaConfig, type AbrirCajaEstado } from "./abrir_caja-types.js";

/** U9d.3: el panel suma estilos y ajustes comunes al panel de siempre. */
const AbrirCajaPropiedades = crearPropiedadesConAjustes(AbrirCajaPropiedadesBase, {
  presets: PRESETS_ABRIR_CAJA,
  storageKey: "actividad.abrir_caja.estilos",
});

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
  // U9d.3: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_ABRIR_CAJA,
  puntuacion: (estado: AbrirCajaEstado, respuesta?: unknown) =>
    evaluarAbrirCaja(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["abrir_caja"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<AbrirCajaEstado, AbrirCajaConfig>;

export type AbrirCajaDefinition = typeof abrirCajaDefinition;
