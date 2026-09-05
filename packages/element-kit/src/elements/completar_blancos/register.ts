import type { ElementRegistry } from "../../registry.js";
import { completarBlancosDefinition } from "./completar_blancos-definition.js";

/** Registra completar_blancos en el catálogo único (Regla 2). */
export function registrarCompletarBlancos(
  registry: ElementRegistry<{ completar_blancos: typeof completarBlancosDefinition }>,
): void {
  registry.registrar(completarBlancosDefinition);
}
