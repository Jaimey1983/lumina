import type { DividerBlock } from "lumina-frontend/blocks/separador";

export const SEPARADOR_TIPO = "separador" as const;
export type SeparadorEstado = DividerBlock;
export type SeparadorConfig = Record<string, unknown>;
