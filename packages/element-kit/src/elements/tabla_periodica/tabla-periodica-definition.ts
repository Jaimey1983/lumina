import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTablaPeriodicaBlock } from "../../widgets/tabla_periodica/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  TablaPeriodicaEditor,
  TablaPeriodicaPropiedades,
  TablaPeriodicaViewer,
} from "./tabla-periodica-adapters.js";
import {
  TABLA_PERIODICA_TIPO,
  type TablaPeriodicaConfig,
  type TablaPeriodicaEstado,
} from "./tabla-periodica-types.js";

/** Q3 — familia Lienzo, datos @lumina/chemistry. */
export const tablaPeriodicaDefinition = {
  tipo: TABLA_PERIODICA_TIPO,
  crearPorDefecto: () => createDefaultTablaPeriodicaBlock(),
  Editor: TablaPeriodicaEditor,
  Viewer: TablaPeriodicaViewer,
  Propiedades: TablaPeriodicaPropiedades,
  apariencia: { color: true, tipografia: true, animacion: false },
  eventos: ["visitado", "seleccionado"],
  catalogo: CATALOGO_ELEMENTOS["tabla_periodica"],
} as const satisfies ElementDefinition<TablaPeriodicaEstado, TablaPeriodicaConfig>;

export type TablaPeriodicaDefinition = typeof tablaPeriodicaDefinition;
