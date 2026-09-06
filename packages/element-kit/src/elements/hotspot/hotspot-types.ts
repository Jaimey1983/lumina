import type { HotspotWidget } from "lumina-frontend/widgets/hotspot";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Hotspot = el bloque de widget completo. */
export type HotspotEstado = HotspotWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `HotspotViewer`.
 */
export type HotspotConfig = WidgetCanvasConfig;

export const HOTSPOT_TIPO = "hotspot" as const;
