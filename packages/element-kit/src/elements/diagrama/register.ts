import type { ElementRegistry } from "@lumina/element-kit-core";
import { diagramaDefinition } from "./diagrama-definition.js";

/** Registra Diagrama en el catálogo único (Regla 2). */
export function registrarDiagrama(
  registry: ElementRegistry<{ diagrama: typeof diagramaDefinition }>,
): void {
  registry.registrar(diagramaDefinition);
}
