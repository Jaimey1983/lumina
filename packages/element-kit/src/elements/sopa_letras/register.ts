import type { ElementRegistry } from "../../registry.js";
import { sopaLetrasDefinition } from "./sopa_letras-definition.js";

/** Registra SopaLetras en el catálogo único (Regla 2). */
export function registrarSopaLetras(
  registry: ElementRegistry<{ sopa_letras: typeof sopaLetrasDefinition }>,
): void {
  registry.registrar(sopaLetrasDefinition);
}
