import type { ElementRegistry } from "@lumina/element-kit-core";
import { shortAnswerDefinition } from "./short_answer-definition.js";

/** Registra short_answer en el catálogo único (Regla 2). */
export function registrarShortAnswer(
  registry: ElementRegistry<{ short_answer: typeof shortAnswerDefinition }>,
): void {
  registry.registrar(shortAnswerDefinition);
}
