import type { MoleculaWidget } from "@lumina/types/widget";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";
import type { ResolvePubChemName } from "../../widgets/molecula/molecula-properties.js";

export type MoleculaEstado = MoleculaWidget;

export interface MoleculaConfig extends WidgetCanvasConfig {
  readonly resolvePubChemName?: ResolvePubChemName;
}

export const MOLECULA_TIPO = "molecula" as const;
