import type { ReactElement } from "react";
import {
  RenderImage as LegacyRenderImage,
  ImageProperties as LegacyImageProperties,
  type ImageBlock,
} from "lumina-frontend/blocks/imagen";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ImagenConfig, ImagenEstado } from "./imagen-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function ImagenEditor({
  estado,
  config,
}: ElementEditorProps<ImagenEstado, ImagenConfig>): ReactElement {
  return <LegacyRenderImage block={estado} forceFill={config.forceFill} />;
}

/** Adapta el Viewer legacy. */
export function ImagenViewer({
  estado,
}: ElementViewerProps<ImagenEstado, ImagenConfig>): ReactElement {
  return <LegacyRenderImage block={estado} />;
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function ImagenPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ImagenEstado, ImagenConfig>): ReactElement {
  return (
    <LegacyImageProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "imagen") {
          onChange(siguiente as ImageBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "imagen") {
          onChange(siguiente as ImageBlock);
        }
      }}
      onChange={onChange}
    />
  );
}
