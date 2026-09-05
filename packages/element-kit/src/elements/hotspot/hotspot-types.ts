import type { HotspotWidget } from "lumina-frontend/widgets/hotspot";

/** Estado del elemento Hotspot = el bloque de widget completo. */
export type HotspotEstado = HotspotWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `HotspotViewer`.
 */
export interface HotspotConfig {
  readonly isThumbnail?: boolean;
}

export const HOTSPOT_TIPO = "hotspot" as const;
