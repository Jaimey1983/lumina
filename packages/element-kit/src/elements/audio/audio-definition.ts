import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
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
  catalogo: CATALOGO_ELEMENTOS["audio"],
} as const satisfies ElementDefinition<AudioEstado, AudioConfig>;

export type AudioDefinition = typeof audioDefinition;
