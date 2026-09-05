import type { ElementRegistry } from "../../registry.js";
import { carouselDefinition } from "./carousel-definition.js";

export function registrarCarousel(
  registry: ElementRegistry<{ carousel: typeof carouselDefinition }>,
): void {
  registry.registrar(carouselDefinition);
}
