import type { ReactElement } from "react";
import {
  RenderVideo as LegacyRenderVideo,
  VideoProperties as LegacyVideoProperties,
  type VideoBlock,
} from "lumina-frontend/blocks/video";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { VideoConfig, VideoEstado } from "./video-types.js";

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
  onChange,
}: ElementPropsPanelProps<VideoEstado, VideoConfig>): ReactElement {
  return (
    <LegacyVideoProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "video") {
          onChange(siguiente as VideoBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "video") {
          onChange(siguiente as VideoBlock);
        }
      }}
      clearDebounce={() => undefined}
      onChange={onChange}
    />
  );
}
