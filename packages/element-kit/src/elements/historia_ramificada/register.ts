import type { ElementRegistry } from "@lumina/element-kit-core";
import { historiaRamificadaDefinition } from "./historia_ramificada-definition.js";

/** Registra HistoriaRamificada en el catálogo único (Regla 2). */
export function registrarHistoriaRamificada(
  registry: ElementRegistry<{ historia_ramificada: typeof historiaRamificadaDefinition }>,
): void {
  registry.registrar(historiaRamificadaDefinition);
}
