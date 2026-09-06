import type { ElementRegistry } from "@lumina/element-kit-core";
import { clickRevealDefinition } from "./click-reveal-definition.js";

export function registrarClickReveal(
  registry: ElementRegistry<{ "click-reveal": typeof clickRevealDefinition }>,
): void {
  registry.registrar(clickRevealDefinition);
}
