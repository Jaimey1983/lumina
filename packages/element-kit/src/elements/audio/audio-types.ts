import type { AudioBlock } from "../../blocks/audio/index.js";

export const AUDIO_TIPO = "audio" as const;
export type AudioEstado = AudioBlock;
export type AudioConfig = Record<string, unknown>;
