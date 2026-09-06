import {
  ContadorEditor as LegacyContadorEditor,
  ContadorProperties as LegacyContadorProperties,
  ContadorViewer as LegacyContadorViewer,
} from "lumina-frontend/widgets/contador";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ContadorConfig, ContadorEstado } from "./contador-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function ContadorEditor({
  estado,
}: ElementEditorProps<ContadorEstado, ContadorConfig>) {
  return (
    <LegacyContadorEditor
      block={estado}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
    />
  );
}

/** Adapta el Viewer legacy (tick / controles intactos). */
export function ContadorViewer({
  estado,
  config,
}: ElementViewerProps<ContadorEstado, ContadorConfig>) {
  return (
    <LegacyContadorViewer
      block={estado}
      isThumbnail={config.isThumbnail === true}
    />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function ContadorPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ContadorEstado, ContadorConfig>) {
  return (
    <LegacyContadorProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "contador") {
          onChange(siguiente);
        }
      }}
    />
  );
}
