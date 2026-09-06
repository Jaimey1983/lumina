import type { ElementRegistry } from "@lumina/element-kit-core";
import { quizMultipleDefinition } from "./quiz_multiple-definition.js";

/** Registra quiz_multiple en el catálogo único (Regla 2). */
export function registrarQuizMultiple(
  registry: ElementRegistry<{ quiz_multiple: typeof quizMultipleDefinition }>,
): void {
  registry.registrar(quizMultipleDefinition);
}
