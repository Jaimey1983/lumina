import type { TabsWidget } from "../../widgets/tabs/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type TabsEstado = TabsWidget;

/**
 * Configuración del runtime; la apariencia pertenece al estado legacy.
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo widget (VirtualSlideSurface).
 */
export type TabsConfig = WidgetCanvasConfig;

export const TABS_TIPO = "tabs" as const;
