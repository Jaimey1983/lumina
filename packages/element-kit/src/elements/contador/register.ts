import type { ElementRegistry } from "../../registry.js";
import { contadorDefinition } from "./contador-definition.js";

/** Registra Contador en el catálogo único (Regla 2). */
export function registrarContador(
  registry: ElementRegistry<{ contador: typeof contadorDefinition }>,
): void {
  registry.registrar(contadorDefinition);
}
