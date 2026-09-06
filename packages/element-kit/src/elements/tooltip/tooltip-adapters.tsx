import {
  TooltipEditor as LegacyTooltipEditor,
  TooltipProperties as LegacyTooltipProperties,
  TooltipViewer as LegacyTooltipViewer,
} from "lumina-frontend/widgets/tooltip";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { TooltipConfig, TooltipEstado } from "./tooltip-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function TooltipEditor({
  estado,
}: ElementEditorProps<TooltipEstado, TooltipConfig>) {
  return (
    <LegacyTooltipEditor
      block={estado}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
    />
  );
}

/** Adapta el Viewer legacy (burbuja / disparador intactos). */
export function TooltipViewer({
  estado,
  config,
}: ElementViewerProps<TooltipEstado, TooltipConfig>) {
  return (
    <LegacyTooltipViewer
      block={estado}
      isThumbnail={config.isThumbnail === true}
    />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function TooltipPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<TooltipEstado, TooltipConfig>) {
  return (
    <LegacyTooltipProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "tooltip") {
          onChange(siguiente);
        }
      }}
    />
  );
}
