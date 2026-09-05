import type { ElementRegistry } from "../../registry.js";
import { historiaRamificadaDefinition } from "./historia_ramificada-definition.js";

/** Registra HistoriaRamificada en el catálogo único (Regla 2). */
export function registrarHistoriaRamificada(
  registry: ElementRegistry<{ historia_ramificada: typeof historiaRamificadaDefinition }>,
): void {
  registry.registrar(historiaRamificadaDefinition);
}
