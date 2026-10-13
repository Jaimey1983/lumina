import type { ElementRegistry } from "@lumina/element-kit-core";
import { escapeRoomDefinition } from "./escape-room-definition.js";

/** Registra Escape Room en el catálogo único (Regla 2). */
export function registrarEscapeRoom(
  registry: ElementRegistry<{ escape_room: typeof escapeRoomDefinition }>,
): void {
  registry.registrar(escapeRoomDefinition);
}
