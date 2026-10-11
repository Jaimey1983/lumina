import {
  SelloEditor as WidgetEditor,
  SelloProperties as WidgetProperties,
  SelloViewer as WidgetViewer,
} from "../../widgets/sello/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { SelloConfig, SelloEstado } from "./sello-types.js";

export function SelloEditor({ estado, config }: ElementEditorProps<SelloEstado, SelloConfig>) {
  return <WidgetEditor estado={estado} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

export function SelloViewer({ estado, config }: ElementViewerProps<SelloEstado, SelloConfig>) {
  return <WidgetViewer estado={estado} isThumbnail={config.isThumbnail === true} estadoObjeto={config.estadoObjeto} />;
}

export function SelloPropiedades({ estado, onChange }: ElementPropsPanelProps<SelloEstado, SelloConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
