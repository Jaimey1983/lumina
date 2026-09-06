import { createDefaultTooltipBlock } from "lumina-frontend/widgets/tooltip";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  TooltipEditor,
  TooltipPropiedades,
  TooltipViewer,
} from "./tooltip-adapters.js";
import { TOOLTIP_TIPO, type TooltipConfig, type TooltipEstado } from "./tooltip-types.js";

/** E3.2 — Tooltip como ElementDefinition, sin puntuación. */
export const tooltipDefinition = {
  tipo: TOOLTIP_TIPO,
  crearPorDefecto: () => createDefaultTooltipBlock(),
  Editor: TooltipEditor,
  Viewer: TooltipViewer,
  Propiedades: TooltipPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: false,
  },
} as const satisfies ElementDefinition<TooltipEstado, TooltipConfig>;

export type TooltipDefinition = typeof tooltipDefinition;
