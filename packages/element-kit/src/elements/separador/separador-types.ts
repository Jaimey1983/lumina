import type { DividerBlock } from "../../blocks/separador/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const SEPARADOR_TIPO = "separador" as const;
export type SeparadorEstado = DividerBlock;

export type SeparadorConfig = PrimitivePanelConfig;
