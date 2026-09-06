import type { ElementRegistry } from "@lumina/element-kit-core";
import { anagramaDefinition } from "./anagrama-definition.js";

/** Registra el piloto Anagrama en el catálogo único (Regla 2). */
export function registrarAnagrama(
  registry: ElementRegistry<{ anagrama: typeof anagramaDefinition }>,
): void {
  registry.registrar(anagramaDefinition);
}
