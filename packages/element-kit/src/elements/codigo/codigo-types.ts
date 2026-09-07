import type { CodeBlock } from "lumina-frontend/blocks/codigo";

export const CODIGO_TIPO = "codigo" as const;
export type CodigoEstado = CodeBlock;
export type CodigoConfig = Record<string, unknown>;
