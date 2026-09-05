import type { ElementRegistry } from "../../registry.js";
import { quizMultipleDefinition } from "./quiz_multiple-definition.js";

/** Registra quiz_multiple en el catálogo único (Regla 2). */
export function registrarQuizMultiple(
  registry: ElementRegistry<{ quiz_multiple: typeof quizMultipleDefinition }>,
): void {
  registry.registrar(quizMultipleDefinition);
}
