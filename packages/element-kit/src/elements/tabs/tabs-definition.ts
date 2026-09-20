import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTabsBlock } from "../../widgets/tabs/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { TabsEditor, TabsViewer, TabsPropiedades } from "./tabs-adapters.js";
import { TABS_TIPO, type TabsEstado, type TabsConfig } from "./tabs-types.js";

export const TABS_PRESETS = [
  {
    id: "horizontal-clasico",
    label: "Pestañas Clásicas",
    description: "Barra superior con línea indicadora de pestaña activa",
    patch: {
      configuracion: {
        posicionTabs: "arriba",
      },
    },
  },
  {
    id: "tabs-inferiores",
    label: "Pestañas Inferiores",
    description: "Barra de navegación situada en la parte baja del contenedor",
    patch: {
      configuracion: {
        posicionTabs: "abajo",
      },
    },
  },
] as const;

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

