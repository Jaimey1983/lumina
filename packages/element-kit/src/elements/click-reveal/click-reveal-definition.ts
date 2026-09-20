import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultClickRevealBlock } from "../../widgets/click-reveal/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
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

export const CLICK_REVEAL_PRESETS = [
  {
    id: "tarjetas-revelado",
    label: "Tarjetas con Modal",
    description: "Tarjetas clicables que despliegan el contenido en un panel modal",
    patch: {
      configuracion: {
        tipoInteraccion: "modal",
        animacionModal: "slide-up",
      },
    },
  },
  {
    id: "fade-suave",
    label: "Aparición Suave (Fade)",
    description: "Transición atenuada sin desplazamiento para lectura cómoda",
    patch: {
      configuracion: {
        tipoInteraccion: "modal",
        animacionModal: "fade",
      },
    },
  },
] as const;

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
} as const satisfies ElementDefinition<ClickRevealEstado, ClickRevealConfig>;

export type ClickRevealDefinition = typeof clickRevealDefinition;

