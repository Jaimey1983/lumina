import type { ElementRegistry } from "../../registry.js";
import { tooltipDefinition } from "./tooltip-definition.js";

/** Registra Tooltip en el catálogo único (Regla 2). */
export function registrarTooltip(
  registry: ElementRegistry<{ tooltip: typeof tooltipDefinition }>,
): void {
  registry.registrar(tooltipDefinition);
}
