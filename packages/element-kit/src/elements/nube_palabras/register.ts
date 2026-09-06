import type { ElementRegistry } from "@lumina/element-kit-core";
import { nubePalabrasDefinition } from "./nube_palabras-definition.js";

/** Registra nube_palabras en el catálogo único (Regla 2). */
export function registrarNubePalabras(
  registry: ElementRegistry<{ nube_palabras: typeof nubePalabrasDefinition }>,
): void {
  registry.registrar(nubePalabrasDefinition);
}
