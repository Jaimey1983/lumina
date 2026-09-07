import type { QuoteBlock } from "lumina-frontend/blocks/cita";

export const CITA_TIPO = "cita" as const;
export type CitaEstado = QuoteBlock;
export type CitaConfig = Record<string, unknown>;
