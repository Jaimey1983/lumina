import type { AudioBlock } from "../../blocks/audio/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const AUDIO_TIPO = "audio" as const;
export type AudioEstado = AudioBlock;

export type AudioConfig = PrimitivePanelConfig;
