import type { ElementRegistry } from "@lumina/element-kit-core";
import { etiquetarImagenDefinition } from "./etiquetar_imagen-definition.js";

/** Registra Etiquetar imagen en el catálogo único (Regla 2). */
export function registrarEtiquetarImagen(
  registry: ElementRegistry<{ etiquetar_imagen: typeof etiquetarImagenDefinition }>,
): void {
  registry.registrar(etiquetarImagenDefinition);
}
