import type { ElementRegistry } from "@lumina/element-kit-core";
import { topoDefinition } from "./topo-definition.js";

/** Registra Topo en el catálogo único (Regla 2). */
export function registrarTopo(
  registry: ElementRegistry<{ topo: typeof topoDefinition }>,
): void {
  registry.registrar(topoDefinition);
}
