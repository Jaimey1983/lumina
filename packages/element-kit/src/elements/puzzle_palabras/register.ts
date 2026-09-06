import type { ElementRegistry } from "@lumina/element-kit-core";
import { puzzlePalabrasDefinition } from "./puzzle_palabras-definition.js";

/** Registra PuzzlePalabras en el catálogo único (Regla 2). */
export function registrarPuzzlePalabras(
  registry: ElementRegistry<{ puzzle_palabras: typeof puzzlePalabrasDefinition }>,
): void {
  registry.registrar(puzzlePalabrasDefinition);
}
