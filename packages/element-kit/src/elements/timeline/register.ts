import type { ElementRegistry } from "@lumina/element-kit-core";
import { timelineDefinition } from "./timeline-definition.js";

export function registrarTimeline(
  registry: ElementRegistry<{ timeline: typeof timelineDefinition }>,
): void {
  registry.registrar(timelineDefinition);
}
