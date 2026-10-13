import type { ElementRegistry } from "@lumina/element-kit-core";
import { clozeBancoDefinition } from "./cloze_banco-definition.js";

/** Registra Cloze con banco en el catálogo único (Regla 2). */
export function registrarClozeBanco(
  registry: ElementRegistry<{ cloze_banco: typeof clozeBancoDefinition }>,
): void {
  registry.registrar(clozeBancoDefinition);
}
