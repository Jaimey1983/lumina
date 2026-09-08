import type { DividerBlock } from "../../blocks/separador/index.js";

export const SEPARADOR_TIPO = "separador" as const;
export type SeparadorEstado = DividerBlock;
export type SeparadorConfig = Record<string, unknown>;
