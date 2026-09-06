import { createDefaultTimelineBlock } from "lumina-frontend/widgets/timeline";
import type { ElementDefinition } from "@lumina/element-kit-core";
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

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const timelineDefinition = {
  tipo: TIMELINE_TIPO,
  crearPorDefecto: () => createDefaultTimelineBlock(),
  Editor: TimelineEditor,
  Viewer: TimelineViewer,
  Propiedades: TimelinePropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
} as const satisfies ElementDefinition<TimelineEstado, TimelineConfig>;

export type TimelineDefinition = typeof timelineDefinition;
