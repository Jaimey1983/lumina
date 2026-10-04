import type { ElementRegistry } from "@lumina/element-kit-core";
import { tablaPeriodicaDefinition } from "./tabla-periodica-definition.js";

export function registrarTablaPeriodica(
  registry: ElementRegistry<{ tabla_periodica: typeof tablaPeriodicaDefinition }>,
): void {
  registry.registrar(tablaPeriodicaDefinition);
}
