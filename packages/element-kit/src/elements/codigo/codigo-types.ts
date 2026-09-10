import type { CodeBlock } from "../../blocks/codigo/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const CODIGO_TIPO = "codigo" as const;
export type CodigoEstado = CodeBlock;

export type CodigoConfig = PrimitivePanelConfig;
