import type { ReactElement } from "react";
import {
  RenderAudio as LegacyRenderAudio,
  AudioProperties as LegacyAudioProperties,
  type AudioBlock,
} from "../../blocks/audio/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { AudioConfig, AudioEstado } from "./audio-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

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
  config,
  onChange,
}: ElementPropsPanelProps<AudioEstado, AudioConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "audio",
  );
  return <LegacyAudioProperties block={estado} {...applyProps} />;
}
