import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTimelineBlock } from "../../widgets/timeline/index.js";
import { TIMELINE_VARIANTES } from "../../widgets/timeline/timeline-variant-meta.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  TimelineEditor,
  TimelineViewer,
  TimelinePropiedades,
} from "./timeline-adapters.js";
import {
  TIMELINE_TIPO,
  type TimelineEstado,
  type TimelineConfig,
} from "./timeline-types.js";

export const TIMELINE_PRESETS: readonly ElementPreset<TimelineEstado>[] =
  TIMELINE_VARIANTES.map((v) => ({
    id: v.id,
    label: v.label,
    description: v.description,
    patch: {
      configuracion: {
        variante: v.id,
      },
    } as unknown as Partial<TimelineEstado>,
  }));

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const timelineDefinition = {
  tipo: TIMELINE_TIPO,
  crearPorDefecto: () => createDefaultTimelineBlock(),
  Editor: TimelineEditor,
  Viewer: TimelineViewer,
  Propiedades: TimelinePropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["timeline"],
  presets: TIMELINE_PRESETS,
} as const satisfies ElementDefinition<TimelineEstado, TimelineConfig>;

export type TimelineDefinition = typeof timelineDefinition;
