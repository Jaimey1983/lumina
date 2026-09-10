import type { ReactElement } from "react";
import {
  RenderImage as LegacyRenderImage,
  ImageProperties as LegacyImageProperties,
  type ImageBlock,
} from "../../blocks/imagen/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ImagenConfig, ImagenEstado } from "./imagen-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

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
  config,
  onChange,
}: ElementPropsPanelProps<ImagenEstado, ImagenConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "imagen",
  );
  return <LegacyImageProperties block={estado} {...applyProps} />;
}
