import type { ElementRegistry } from "@lumina/element-kit-core";
import { problemaPasosDefinition } from "./problema_pasos-definition.js";

/** Registra Problema paso a paso en el catálogo único (Regla 2). */
export function registrarProblemaPasos(
  registry: ElementRegistry<{ problema_pasos: typeof problemaPasosDefinition }>,
): void {
  registry.registrar(problemaPasosDefinition);
}
