import { createDefaultTabsBlock } from "lumina-frontend/widgets/tabs";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { TabsEditor, TabsViewer, TabsPropiedades } from "./tabs-adapters.js";
import { TABS_TIPO, type TabsEstado, type TabsConfig } from "./tabs-types.js";

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const tabsDefinition = {
  tipo: TABS_TIPO,
  crearPorDefecto: () => createDefaultTabsBlock(),
  Editor: TabsEditor,
  Viewer: TabsViewer,
  Propiedades: TabsPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
} as const satisfies ElementDefinition<TabsEstado, TabsConfig>;

export type TabsDefinition = typeof tabsDefinition;
