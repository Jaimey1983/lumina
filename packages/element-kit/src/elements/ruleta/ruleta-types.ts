import type { RuletaWidget } from "lumina-frontend/widgets/ruleta";

/** Estado del elemento Ruleta = el bloque de widget completo. */
export type RuletaEstado = RuletaWidget;

/** Ruleta no requiere configuración adicional del runtime. */
export type RuletaConfig = Readonly<Record<string, never>>;

export const RULETA_TIPO = "ruleta" as const;
