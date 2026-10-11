import type { TabsWidgetT12 } from "../../widgets/tabs/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type TabsEstado = TabsWidgetT12;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type TabsConfig = WidgetCanvasConfig;

export const TABS_TIPO = "tabs" as const;
