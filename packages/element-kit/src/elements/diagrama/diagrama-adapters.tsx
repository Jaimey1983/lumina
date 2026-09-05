import {
  DiagramaEditor as LegacyDiagramaEditor,
  DiagramaProperties as LegacyDiagramaProperties,
  DiagramaViewer as LegacyDiagramaViewer,
} from "lumina-frontend/blocks/diagrama";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { DiagramaConfig, DiagramaEstado } from "./diagrama-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function DiagramaEditor({
  estado,
  config,
  onChange,
}: ElementEditorProps<DiagramaEstado, DiagramaConfig>) {
  return (
    <LegacyDiagramaEditor
      isSelected={config.isSelected === true}
      onChange={onChange}
      block={estado}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
    />
  );
}

/** Adapta el Viewer legacy (grafo y Venn intactos). */
export function DiagramaViewer({
  estado,
  config,
}: ElementViewerProps<DiagramaEstado, DiagramaConfig>) {
  return (
    <LegacyDiagramaViewer
      block={estado}
      isThumbnail={config.isThumbnail === true}
    />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function DiagramaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<DiagramaEstado, DiagramaConfig>) {
  return (
    <LegacyDiagramaProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "diagrama") {
          onChange(siguiente);
        }
      }}
    />
  );
}
