import type { ElementRegistry } from "@lumina/element-kit-core";
import { ordenarPasosDefinition } from "./ordenar_pasos-definition.js";

/** Registra ordenar_pasos en el catálogo único (Regla 2). */
export function registrarOrdenarPasos(
  registry: ElementRegistry<{ ordenar_pasos: typeof ordenarPasosDefinition }>,
): void {
  registry.registrar(ordenarPasosDefinition);
}
