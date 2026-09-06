import {
  ProgresoEditor as LegacyProgresoEditor,
  ProgresoProperties as LegacyProgresoProperties,
  ProgresoViewer as LegacyProgresoViewer,
} from "lumina-frontend/widgets/progreso";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ProgresoConfig, ProgresoEstado } from "./progreso-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function ProgresoEditor({
  estado,
}: ElementEditorProps<ProgresoEstado, ProgresoConfig>) {
  return (
    <LegacyProgresoEditor
      block={estado}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
    />
  );
}

/** Adapta el Viewer legacy (modo slides / manual intacto). */
export function ProgresoViewer({
  estado,
  config,
}: ElementViewerProps<ProgresoEstado, ProgresoConfig>) {
  return (
    <LegacyProgresoViewer
      block={estado}
      isThumbnail={config.isThumbnail === true}
    />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function ProgresoPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ProgresoEstado, ProgresoConfig>) {
  return (
    <LegacyProgresoProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "progreso") {
          onChange(siguiente);
        }
      }}
    />
  );
}
