import type { ElementRegistry } from "@lumina/element-kit-core";
import { lineaTiempoDefinition } from "./linea_tiempo-definition.js";

/** Registra Línea de tiempo en el catálogo único (Regla 2). */
export function registrarLineaTiempo(
  registry: ElementRegistry<{ linea_tiempo: typeof lineaTiempoDefinition }>,
): void {
  registry.registrar(lineaTiempoDefinition);
}
