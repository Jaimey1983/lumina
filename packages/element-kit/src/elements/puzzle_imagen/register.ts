import type { ElementRegistry } from "@lumina/element-kit-core";
import { puzzleImagenDefinition } from "./puzzle_imagen-definition.js";

/** Registra PuzzleImagen en el catálogo único (Regla 2). */
export function registrarPuzzleImagen(
  registry: ElementRegistry<{ puzzle_imagen: typeof puzzleImagenDefinition }>,
): void {
  registry.registrar(puzzleImagenDefinition);
}
