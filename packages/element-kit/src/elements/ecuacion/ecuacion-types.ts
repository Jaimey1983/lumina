import type { EquationBlock } from "../../blocks/ecuacion/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const ECUACION_TIPO = "ecuacion" as const;
export type EcuacionEstado = EquationBlock;
export type EcuacionConfig = PrimitivePanelConfig;
