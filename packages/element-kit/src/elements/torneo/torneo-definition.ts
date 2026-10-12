import type { ElementDefinition } from "@lumina/element-kit-core";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTorneo } from "../../activities/torneo/index.js";
import { TorneoEditor, TorneoPropiedades, TorneoViewer } from "./torneo-adapters.js";
import { TORNEO_TIPO, type TorneoConfig, type TorneoEstado } from "./torneo-types.js";

/**
 * U11.1 — Torneo como `ElementDefinition`. Sin `puntuacion`: en `@lumina/scoring` es `exclude`
 * (no entra al promedio; las notas del torneo son gamificación). El viewer no usa el
 * `ActivityShell` (el ritmo lo marca el docente por socket), así que no declara `ajustes` comunes.
 */
export const torneoDefinition = {
  tipo: TORNEO_TIPO,
  crearPorDefecto: () => createDefaultTorneo(),
  Editor: TorneoEditor,
  Viewer: TorneoViewer,
  Propiedades: TorneoPropiedades,
  apariencia: { color: false, tipografia: false, animacion: false },
  catalogo: CATALOGO_ELEMENTOS["torneo"],
} as const satisfies ElementDefinition<TorneoEstado, TorneoConfig>;

export type TorneoDefinition = typeof torneoDefinition;
