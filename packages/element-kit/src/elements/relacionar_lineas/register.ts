import type { ElementRegistry } from "@lumina/element-kit-core";
import { relacionarLineasDefinition } from "./relacionar_lineas-definition.js";

/** Registra Relacionar con líneas en el catálogo único (Regla 2). */
export function registrarRelacionarLineas(
  registry: ElementRegistry<{ relacionar_lineas: typeof relacionarLineasDefinition }>,
): void {
  registry.registrar(relacionarLineasDefinition);
}
