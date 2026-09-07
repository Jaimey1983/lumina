import type { ReactElement } from "react";
import {
  RenderAudio as LegacyRenderAudio,
  AudioProperties as LegacyAudioProperties,
  type AudioBlock,
} from "lumina-frontend/blocks/audio";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { AudioConfig, AudioEstado } from "./audio-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function AudioEditor({
  estado,
}: ElementEditorProps<AudioEstado, AudioConfig>): ReactElement {
  return <LegacyRenderAudio block={estado} />;
}

/** Adapta el Viewer legacy. */
export function AudioViewer({
  estado,
}: ElementViewerProps<AudioEstado, AudioConfig>): ReactElement {
  return <LegacyRenderAudio block={estado} />;
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function AudioPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<AudioEstado, AudioConfig>): ReactElement {
  return (
    <LegacyAudioProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "audio") {
          onChange(siguiente as AudioBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "audio") {
          onChange(siguiente as AudioBlock);
        }
      }}
      clearDebounce={() => undefined}
      onChange={onChange}
    />
  );
}
