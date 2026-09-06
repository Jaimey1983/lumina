import type { ElementRegistry } from "@lumina/element-kit-core";
import { abrirCajaDefinition } from "./abrir_caja-definition.js";

/** Registra AbrirCaja en el catálogo único (Regla 2). */
export function registrarAbrirCaja(
  registry: ElementRegistry<{ abrir_caja: typeof abrirCajaDefinition }>,
): void {
  registry.registrar(abrirCajaDefinition);
}
