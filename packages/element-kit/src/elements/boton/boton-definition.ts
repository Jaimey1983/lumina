import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultBotonBlock } from "../../widgets/boton/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { BotonEditor, BotonPropiedades, BotonViewer } from "./boton-adapters.js";
import { BOTON_TIPO, type BotonConfig, type BotonEstado } from "./boton-types.js";

export const BOTON_PRESETS: readonly ElementPreset<BotonEstado>[] = [
  {
    id: "primario",
    label: "Primario Tema",
    description: "Sólido con el color de acento del tema",
    patch: { variante: "primary", outline: false, forma: "redondeado" } as unknown as Partial<BotonEstado>,
  },
  {
    id: "contorno",
    label: "Contorno Elegante",
    description: "Líneas finas con fondo transparente",
    patch: { variante: "primary", outline: true, forma: "redondeado" } as unknown as Partial<BotonEstado>,
  },
  {
    id: "pill",
    label: "Pill Destacado",
    description: "Bordes completamente redondeados",
    patch: { variante: "primary", outline: false, forma: "pill" } as unknown as Partial<BotonEstado>,
  },
  {
    id: "secundario",
    label: "Sutil / Secundario",
    description: "Tono neutro para acciones de menor jerarquía",
    patch: { variante: "secondary", outline: false, forma: "redondeado" } as unknown as Partial<BotonEstado>,
  },
];

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

