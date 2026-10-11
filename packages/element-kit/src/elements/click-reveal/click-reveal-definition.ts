import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultClickRevealBlock } from "../../widgets/click-reveal/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  ClickRevealEditor,
  ClickRevealViewer,
  ClickRevealPropiedades,
} from "./click-reveal-adapters.js";
import {
  CLICK_REVEAL_TIPO,
  type ClickRevealEstado,
  type ClickRevealConfig,
} from "./click-reveal-types.js";

export const CLICK_REVEAL_PRESETS: readonly ElementPreset<ClickRevealEstado>[] = [
  {
    id: "tarjetas-revelado",
    label: "Tarjetas con Modal",
    description: "Tarjetas clicables que despliegan el contenido en un panel modal",
    estadoPatch: { configuracion: { efectoApertura: "slide-up" } },
  },
  {
    id: "fade-suave",
    label: "Aparición Suave (Fade)",
    description: "Transición atenuada sin desplazamiento para lectura cómoda",
    estadoPatch: { configuracion: { efectoApertura: "fade" } },
  },
  {
    id: "voltear",
    label: "Voltear tarjeta",
    description: "La tarjeta se da vuelta y muestra el contenido, con contador de progreso",
    estadoPatch: { configuracion: { disparo: "flip", mostrarContador: true } },
  },
  {
    id: "foco",
    label: "Foco",
    description: "Resalta la tarjeta elegida y atenúa las demás",
    estadoPatch: { configuracion: { disparo: "spotlight", mostrarContador: true } },
  },
  {
    id: "difuminado",
    label: "Difuminado",
    description: "El texto aparece borroso y se aclara al tocar la tarjeta",
    estadoPatch: { configuracion: { disparo: "blur", mostrarContador: true } },
  },
  {
    id: "progreso-completo",
    label: "Revelar todo",
    description: "Ventana de siempre, con contador y aviso hasta revelar todas",
    estadoPatch: { configuracion: { mostrarContador: true, bloquearHastaRevelar: true } },
  },
];

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const clickRevealDefinition = {
  tipo: CLICK_REVEAL_TIPO,
  crearPorDefecto: () => createDefaultClickRevealBlock(),
  Editor: ClickRevealEditor,
  Viewer: ClickRevealViewer,
  Propiedades: ClickRevealPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["click-reveal"],
  presets: CLICK_REVEAL_PRESETS,
  // T13: `seleccionado` por tarjeta revelada y `visitado` al revelar todas.
  eventos: ["seleccionado", "visitado"],
} as const satisfies ElementDefinition<ClickRevealEstado, ClickRevealConfig>;

export type ClickRevealDefinition = typeof clickRevealDefinition;

