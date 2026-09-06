import type { RuletaWidget } from "lumina-frontend/widgets/ruleta";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Ruleta = el bloque de widget completo. */
export type RuletaEstado = RuletaWidget;

/** Runtime del canvas: thumbnail + selección del bloque. */
export type RuletaConfig = WidgetCanvasConfig;

export const RULETA_TIPO = "ruleta" as const;
