import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultBotonBlock } from "../../widgets/boton/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { BotonEditor, BotonPropiedades, BotonViewer } from "./boton-adapters.js";
import { BOTON_TIPO, type BotonConfig, type BotonEstado } from "./boton-types.js";

export const BOTON_PRESETS = [
  {
    id: "primario",
    label: "Primario Tema",
    description: "Sólido con el color de acento del tema",
    patch: { variante: "primary", outline: false, forma: "redondeado" },
  },
  {
    id: "contorno",
    label: "Contorno Elegante",
    description: "Líneas finas con fondo transparente",
    patch: { variante: "primary", outline: true, forma: "redondeado" },
  },
  {
    id: "pill",
    label: "Pill Destacado",
    description: "Bordes completamente redondeados",
    patch: { variante: "primary", outline: false, forma: "pill" },
  },
  {
    id: "secundario",
    label: "Sutil / Secundario",
    description: "Tono neutro para acciones de menor jerarquía",
    patch: { variante: "secondary", outline: false, forma: "redondeado" },
  },
] as const;

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
  catalogo: CATALOGO_ELEMENTOS["boton"],
  presets: BOTON_PRESETS,
} as const satisfies ElementDefinition<BotonEstado, BotonConfig>;

export type BotonDefinition = typeof botonDefinition;

