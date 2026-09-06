import {
  RuletaEditor as LegacyRuletaEditor,
  RuletaProperties as LegacyRuletaProperties,
  RuletaViewer as LegacyRuletaViewer,
} from "lumina-frontend/widgets/ruleta";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { RuletaConfig, RuletaEstado } from "./ruleta-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function RuletaEditor({
  estado,
}: ElementEditorProps<RuletaEstado, RuletaConfig>) {
  return (
    <LegacyRuletaEditor
      block={estado}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
    />
  );
}

/** Adapta el Viewer legacy sin alterar el giro ni la selección del ganador. */
export function RuletaViewer({
  estado,
}: ElementViewerProps<RuletaEstado, RuletaConfig>) {
  return <LegacyRuletaViewer block={estado} />;
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function RuletaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<RuletaEstado, RuletaConfig>) {
  return (
    <LegacyRuletaProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "ruleta") {
          onChange(siguiente);
        }
      }}
    />
  );
}
