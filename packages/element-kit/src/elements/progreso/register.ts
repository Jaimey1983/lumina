import type { ElementRegistry } from "@lumina/element-kit-core";
import { progresoDefinition } from "./progreso-definition.js";

/** Registra Progreso (Barra) en el catálogo único (Regla 2). */
export function registrarProgreso(
  registry: ElementRegistry<{ progreso: typeof progresoDefinition }>,
): void {
  registry.registrar(progresoDefinition);
}
