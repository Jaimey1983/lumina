import { createDefaultBotonBlock } from "lumina-frontend/widgets/boton";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { BotonEditor, BotonPropiedades, BotonViewer } from "./boton-adapters.js";
import { BOTON_TIPO, type BotonConfig, type BotonEstado } from "./boton-types.js";

/**
 * Piloto E1.4 — Botón como `ElementDefinition`.
 * Sin `puntuacion`: el Botón no puntúa.
 */
export const botonDefinition = {
  tipo: BOTON_TIPO,
  crearPorDefecto: () => createDefaultBotonBlock(),
  Editor: BotonEditor,
  Viewer: BotonViewer,
  Propiedades: BotonPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: false,
  },
} as const satisfies ElementDefinition<BotonEstado, BotonConfig>;

export type BotonDefinition = typeof botonDefinition;
