import type { QuoteBlock } from "../../blocks/cita/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const CITA_TIPO = "cita" as const;
export type CitaEstado = QuoteBlock;

export type CitaConfig = PrimitivePanelConfig;
