import type { ReactElement } from "react";
import {
  RenderVideo as LegacyRenderVideo,
  VideoProperties as LegacyVideoProperties,
  type VideoBlock,
} from "../../blocks/video/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { VideoConfig, VideoEstado } from "./video-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function VideoEditor({
  estado,
  config,
}: ElementEditorProps<VideoEstado, VideoConfig>): ReactElement {
  return (
    <LegacyRenderVideo
      block={estado}
      isThumbnail={config.isThumbnail === true}
      editorMode={true}
    />
  );
}

/** Adapta el Viewer legacy. */
export function VideoViewer({
  estado,
  config,
}: ElementViewerProps<VideoEstado, VideoConfig>): ReactElement {
  return (
    <LegacyRenderVideo
      block={estado}
      isThumbnail={config.isThumbnail === true}
      editorMode={false}
    />
  );
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function VideoPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<VideoEstado, VideoConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "video",
  );
  return <LegacyVideoProperties block={estado} {...applyProps} />;
}
