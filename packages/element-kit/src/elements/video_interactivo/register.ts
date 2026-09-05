import type { ElementRegistry } from "../../registry.js";
import { videoInteractivoDefinition } from "./video_interactivo-definition.js";

/** Registra video_interactivo en el catálogo único (Regla 2). */
export function registrarVideoInteractivo(
  registry: ElementRegistry<{ video_interactivo: typeof videoInteractivoDefinition }>,
): void {
  registry.registrar(videoInteractivoDefinition);
}
