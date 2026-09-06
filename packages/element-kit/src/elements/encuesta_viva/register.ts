import type { ElementRegistry } from "@lumina/element-kit-core";
import { encuestaVivaDefinition } from "./encuesta_viva-definition.js";

/** Registra encuesta_viva en el catálogo único (Regla 2). */
export function registrarEncuestaViva(
  registry: ElementRegistry<{ encuesta_viva: typeof encuestaVivaDefinition }>,
): void {
  registry.registrar(encuestaVivaDefinition);
}
