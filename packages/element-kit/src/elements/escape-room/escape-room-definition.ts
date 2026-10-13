import type { ElementDefinition } from "@lumina/element-kit-core";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultEscapeRoom } from "../../activities/escape-room/index.js";
import {
  EscapeRoomEditor,
  EscapeRoomPropiedades,
  EscapeRoomViewer,
} from "./escape-room-adapters.js";
import { ESCAPE_ROOM_TIPO, type EscapeRoomConfig, type EscapeRoomEstado } from "./escape-room-types.js";

/**
 * U11.4 — Escape Room como `ElementDefinition`. Sin `puntuacion`: en `@lumina/scoring` es `exclude`
 * (los puntos son gamificación narrativa y salen por su propio canal, no como nota). El viewer no usa
 * el `ActivityShell` (la partida en equipos la lleva el servidor), así que no declara `ajustes` comunes.
 */
export const escapeRoomDefinition = {
  tipo: ESCAPE_ROOM_TIPO,
  crearPorDefecto: () => createDefaultEscapeRoom(),
  Editor: EscapeRoomEditor,
  Viewer: EscapeRoomViewer,
  Propiedades: EscapeRoomPropiedades,
  apariencia: { color: false, tipografia: false, animacion: false },
  catalogo: CATALOGO_ELEMENTOS["escape_room"],
} as const satisfies ElementDefinition<EscapeRoomEstado, EscapeRoomConfig>;

export type EscapeRoomDefinition = typeof escapeRoomDefinition;
