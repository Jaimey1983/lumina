import type { ElementRegistry } from "../../registry.js";
import { botonDefinition } from "./boton-definition.js";

/** Registra el piloto Botón en el catálogo único (Regla 2). */
export function registrarBoton(
  registry: ElementRegistry<{ boton: typeof botonDefinition }>,
): void {
  registry.registrar(botonDefinition);
}
