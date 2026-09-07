import { createDefaultAudioBlock } from "lumina-frontend/blocks/audio";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  AudioEditor,
  AudioPropiedades,
  AudioViewer,
} from "./audio-adapters.js";
import {
  AUDIO_TIPO,
  type AudioConfig,
  type AudioEstado,
} from "./audio-types.js";

export const audioDefinition = {
  tipo: AUDIO_TIPO,
  crearPorDefecto: () => createDefaultAudioBlock(),
  Editor: AudioEditor,
  Viewer: AudioViewer,
  Propiedades: AudioPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: true,
  },
} as const satisfies ElementDefinition<AudioEstado, AudioConfig>;

export type AudioDefinition = typeof audioDefinition;
