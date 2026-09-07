import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultClickRevealBlock } from "lumina-frontend/widgets/click-reveal";
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

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const clickRevealDefinition = {
  tipo: CLICK_REVEAL_TIPO,
  crearPorDefecto: () => createDefaultClickRevealBlock(),
  Editor: ClickRevealEditor,
  Viewer: ClickRevealViewer,
  Propiedades: ClickRevealPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["click-reveal"],
} as const satisfies ElementDefinition<ClickRevealEstado, ClickRevealConfig>;

export type ClickRevealDefinition = typeof clickRevealDefinition;
