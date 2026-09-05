import type { ElementRegistry } from "../../registry.js";
import { puzzleImagenDefinition } from "./puzzle_imagen-definition.js";

/** Registra PuzzleImagen en el catálogo único (Regla 2). */
export function registrarPuzzleImagen(
  registry: ElementRegistry<{ puzzle_imagen: typeof puzzleImagenDefinition }>,
): void {
  registry.registrar(puzzleImagenDefinition);
}
