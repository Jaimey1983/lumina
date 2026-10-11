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
    estadoPatch: { variante: "primary", outline: false, forma: "redondeado" },
  },
  {
    id: "contorno",
    label: "Contorno Elegante",
    description: "Líneas finas con fondo transparente",
    estadoPatch: { variante: "primary", outline: true, forma: "redondeado" },
  },
  {
    id: "pill",
    label: "Pill Destacado",
    description: "Bordes completamente redondeados",
    estadoPatch: { variante: "primary", outline: false, forma: "pill" },
  },
  {
    id: "secundario",
    label: "Sutil / Secundario",
    description: "Tono neutro para acciones de menor jerarquía",
    estadoPatch: { variante: "secondary", outline: false, forma: "redondeado" },
  },
  {
    id: "suave",
    label: "Suave",
    description: "Fondo tintado y texto del mismo tono, sin borde",
    estadoPatch: { variante: "primary", estilo: "soft", outline: false, forma: "redondeado" },
  },
  {
    id: "fantasma",
    label: "Fantasma",
    description: "Sin fondo ni borde; se tiñe al pasar el puntero",
    estadoPatch: { variante: "primary", estilo: "ghost", outline: false, forma: "redondeado" },
  },
  {
    id: "enlace",
    label: "Enlace",
    description: "Texto subrayado, como un vínculo",
    estadoPatch: { variante: "primary", estilo: "link", outline: false },
  },
  {
    id: "con-flecha",
    label: "Con flecha",
    description: "Sólido con una flecha a la derecha para avanzar",
    estadoPatch: {
      variante: "primary",
      estilo: "solid",
      outline: false,
      icono: "flecha-derecha",
      iconoPosicion: "derecha",
    },
  },
  {
    id: "descarga",
    label: "Descarga",
    description: "Contorno con icono; baja el archivo de la URL",
    estadoPatch: {
      variante: "primary",
      estilo: "outline",
      outline: true,
      icono: "descargar",
      iconoPosicion: "izquierda",
      accion: "descargar",
    },
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
  // Etapa K / K3: eventos que este elemento emite por `config.emitir`.
  eventos: ["clic", "hover_entra", "hover_sale"],
  presets: BOTON_PRESETS,
} as const satisfies ElementDefinition<BotonEstado, BotonConfig>;

export type BotonDefinition = typeof botonDefinition;

