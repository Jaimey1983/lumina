import type { ElementRegistry } from "@lumina/element-kit-core";
import { arrastrarSoltarDefinition } from "./arrastrar_soltar-definition.js";

/** Registra arrastrar_soltar en el catálogo único (Regla 2). */
export function registrarArrastrarSoltar(
  registry: ElementRegistry<{ arrastrar_soltar: typeof arrastrarSoltarDefinition }>,
): void {
  registry.registrar(arrastrarSoltarDefinition);
}
