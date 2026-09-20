import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTooltipBlock } from "../../widgets/tooltip/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  TooltipEditor,
  TooltipPropiedades,
  TooltipViewer,
} from "./tooltip-adapters.js";
import { TOOLTIP_TIPO, type TooltipConfig, type TooltipEstado } from "./tooltip-types.js";

export const TOOLTIP_PRESETS = [
  {
    id: "icono-info",
    label: "Ícono de Ayuda",
    description: "Ícono circular clásico para definiciones y notas breves",
    patch: {
      triggerTipo: "icono",
      icono: "help",
      posicion: "auto",
    },
  },
  {
    id: "texto-subrayado",
    label: "Término en Texto",
    description: "Palabra o frase con subrayado interactivo",
    patch: {
      triggerTipo: "texto_subrayado",
      posicion: "auto",
    },
  },
  {
    id: "punto-discreto",
    label: "Punto Discreto",
    description: "Punto interactivo para diagramas e imágenes",
    patch: {
      triggerTipo: "punto",
      posicion: "auto",
    },
  },
] as const;

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
  catalogo: CATALOGO_ELEMENTOS["tooltip"],
  presets: TOOLTIP_PRESETS,
} as const satisfies ElementDefinition<TooltipEstado, TooltipConfig>;

export type TooltipDefinition = typeof tooltipDefinition;

