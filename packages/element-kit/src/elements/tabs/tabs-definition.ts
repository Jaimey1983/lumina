import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTabsBlock } from "../../widgets/tabs/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { TabsEditor, TabsViewer, TabsPropiedades } from "./tabs-adapters.js";
import { TABS_TIPO, type TabsEstado, type TabsConfig } from "./tabs-types.js";

/**
 * T12 — presets reales (T2b los había quitado: no había opción que parchear). Cada uno combina
 * una variante de barra con una transición de panel.
 */
export const TABS_PRESETS: readonly ElementPreset<TabsEstado>[] = [
  {
    id: "subrayado",
    label: "Subrayado",
    description: "Pestañas con línea inferior y fundido suave entre paneles",
    estadoPatch: { configuracion: { variante: "underline", transicion: "fundido" } },
  },
  {
    id: "panel-pildoras",
    label: "Píldoras",
    description: "Pestañas redondeadas con la activa rellena",
    estadoPatch: { configuracion: { variante: "pills", transicion: "fundido" } },
  },
  {
    id: "carpeta",
    label: "Carpeta",
    description: "Pestañas cerradas que se funden con el panel",
    estadoPatch: { configuracion: { variante: "enclosed", transicion: "ninguna" } },
  },
  {
    id: "segmentado",
    label: "Segmentado",
    description: "Control segmentado compacto, con el panel que se desliza",
    estadoPatch: { configuracion: { variante: "segmented", transicion: "deslizar" } },
  },
  {
    id: "lateral",
    label: "Lateral",
    description: "Pestañas en columna a la izquierda del contenido",
    estadoPatch: { configuracion: { variante: "vertical", transicion: "deslizar" } },
  },
];

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const tabsDefinition = {
  tipo: TABS_TIPO,
  crearPorDefecto: () => createDefaultTabsBlock(),
  Editor: TabsEditor,
  Viewer: TabsViewer,
  Propiedades: TabsPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["tabs"],
  presets: TABS_PRESETS,
} as const satisfies ElementDefinition<TabsEstado, TabsConfig>;

export type TabsDefinition = typeof tabsDefinition;

