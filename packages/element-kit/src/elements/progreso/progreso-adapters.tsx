import {
  type ProgresoWidget,
  ProgresoEditor as LegacyProgresoEditor,
  ProgresoProperties as LegacyProgresoProperties,
  ProgresoViewer as LegacyProgresoViewer,
} from "../../widgets/progreso/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ProgresoConfig, ProgresoEstado } from "./progreso-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function ProgresoEditor({
  estado,
  config,
}: ElementEditorProps<ProgresoEstado, ProgresoConfig>) {
  return (
    <LegacyProgresoEditor
      block={estado as ProgresoWidget}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
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
      block={estado as ProgresoWidget}
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
      block={estado as ProgresoWidget}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as ProgresoWidget);
        if (siguiente.tipo === "progreso") {
          onChange(siguiente as ProgresoEstado);
        }
      }}
    />
  );
}
