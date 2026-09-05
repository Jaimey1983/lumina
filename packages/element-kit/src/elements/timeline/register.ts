import type { ElementRegistry } from "../../registry.js";
import { timelineDefinition } from "./timeline-definition.js";

export function registrarTimeline(
  registry: ElementRegistry<{ timeline: typeof timelineDefinition }>,
): void {
  registry.registrar(timelineDefinition);
}
