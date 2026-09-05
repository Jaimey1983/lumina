import type { ElementRegistry } from "../../registry.js";
import { clickRevealDefinition } from "./click-reveal-definition.js";

export function registrarClickReveal(
  registry: ElementRegistry<{ "click-reveal": typeof clickRevealDefinition }>,
): void {
  registry.registrar(clickRevealDefinition);
}
