import type { TabsWidget } from "lumina-frontend/widgets/tabs";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type TabsEstado = TabsWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type TabsConfig = WidgetCanvasConfig;

export const TABS_TIPO = "tabs" as const;
