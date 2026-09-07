import type { AudioBlock } from "lumina-frontend/blocks/audio";

export const AUDIO_TIPO = "audio" as const;
export type AudioEstado = AudioBlock;
export type AudioConfig = Record<string, unknown>;
