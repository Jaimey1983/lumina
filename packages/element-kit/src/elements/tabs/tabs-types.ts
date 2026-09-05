import type { TabsWidget } from "lumina-frontend/widgets/tabs";

export type TabsEstado = TabsWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export interface TabsConfig {
  readonly isThumbnail?: boolean;
}

export const TABS_TIPO = "tabs" as const;
