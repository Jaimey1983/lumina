import { DibujoEditor as WidgetEditor, DibujoProperties as WidgetProperties, DibujoViewer as WidgetViewer } from "../../widgets/dibujo/index.js";
import type { ElementEditorProps, ElementPropsPanelProps, ElementViewerProps } from "@lumina/element-kit-core";
import type { DibujoConfig, DibujoEstado } from "./dibujo-types.js";

export function DibujoEditor({ estado, config, onChange }: ElementEditorProps<DibujoEstado, DibujoConfig>) {
  return <WidgetEditor estado={estado} onChange={onChange} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

export function DibujoViewer({ estado, config }: ElementViewerProps<DibujoEstado, DibujoConfig>) {
  return <WidgetViewer estado={estado} isThumbnail={config.isThumbnail === true} />;
}

export function DibujoPropiedades({ estado, onChange }: ElementPropsPanelProps<DibujoEstado, DibujoConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
