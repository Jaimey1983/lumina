import type { QuoteBlock } from "../../blocks/cita/index.js";

export const CITA_TIPO = "cita" as const;
export type CitaEstado = QuoteBlock;
export type CitaConfig = Record<string, unknown>;
