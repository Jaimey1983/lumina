import type { ElementRegistry } from "@lumina/element-kit-core";
import { verdaderoFalsoDefinition } from "./verdadero_falso-definition.js";

/** Registra verdadero_falso en el catálogo único (Regla 2). */
export function registrarVerdaderoFalso(
  registry: ElementRegistry<{ verdadero_falso: typeof verdaderoFalsoDefinition }>,
): void {
  registry.registrar(verdaderoFalsoDefinition);
}
