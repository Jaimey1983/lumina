import type { ElementRegistry } from "@lumina/element-kit-core";
import { popupDefinition } from "./popup-definition.js";

/** Registra Popup en el catálogo único (Regla 2). */
export function registrarPopup(
  registry: ElementRegistry<{ popup: typeof popupDefinition }>,
): void {
  registry.registrar(popupDefinition);
}
