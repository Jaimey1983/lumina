export {
  timelineDefinition,
  type TimelineDefinition,
} from "./timeline-definition.js";
export {
  TimelineEditor,
  TimelineViewer,
  TimelinePropiedades,
} from "./timeline-adapters.js";
export {
  TIMELINE_TIPO,
  type TimelineEstado,
  type TimelineConfig,
} from "./timeline-types.js";
export { registrarTimeline } from "./register.js";
/** Hidratación idéntica a la del widget existente. */
export { normalizeTimelineWidget } from "lumina-frontend/widgets/timeline";
