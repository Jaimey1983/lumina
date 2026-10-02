import type { ElementRegistry } from "@lumina/element-kit-core";
import { respuestaMatematicaDefinition } from "./respuesta_matematica-definition.js";

/** Registra respuesta_matematica en el catálogo único (Regla 2). */
export function registrarRespuestaMatematica(
  registry: ElementRegistry<{
    respuesta_matematica: typeof respuestaMatematicaDefinition;
  }>,
): void {
  registry.registrar(respuestaMatematicaDefinition);
}
