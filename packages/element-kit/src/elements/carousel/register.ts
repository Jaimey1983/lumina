import type { ElementRegistry } from "@lumina/element-kit-core";
import { carouselDefinition } from "./carousel-definition.js";

export function registrarCarousel(
  registry: ElementRegistry<{ carousel: typeof carouselDefinition }>,
): void {
  registry.registrar(carouselDefinition);
}
