import type { ElementRegistry } from "../../registry.js";
import { graficoDefinition } from "./grafico-definition.js";

/** Registra Gráfico en el catálogo único (Regla 2). */
export function registrarGrafico(
  registry: ElementRegistry<{ grafico: typeof graficoDefinition }>,
): void {
  registry.registrar(graficoDefinition);
}
