import type { ElementRegistry } from "../../registry.js";
import { popupDefinition } from "./popup-definition.js";

/** Registra Popup en el catálogo único (Regla 2). */
export function registrarPopup(
  registry: ElementRegistry<{ popup: typeof popupDefinition }>,
): void {
  registry.registrar(popupDefinition);
}
