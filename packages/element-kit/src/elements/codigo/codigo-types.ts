import type { CodeBlock } from "../../blocks/codigo/index.js";

export const CODIGO_TIPO = "codigo" as const;
export type CodigoEstado = CodeBlock;
export type CodigoConfig = Record<string, unknown>;
