import type { ElementRegistry } from "@lumina/element-kit-core";
import { sopaLetrasDefinition } from "./sopa_letras-definition.js";

/** Registra SopaLetras en el catálogo único (Regla 2). */
export function registrarSopaLetras(
  registry: ElementRegistry<{ sopa_letras: typeof sopaLetrasDefinition }>,
): void {
  registry.registrar(sopaLetrasDefinition);
}
