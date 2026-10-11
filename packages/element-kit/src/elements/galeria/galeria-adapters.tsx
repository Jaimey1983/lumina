import {
  GaleriaEditor as WidgetEditor,
  GaleriaProperties as WidgetProperties,
  GaleriaViewer as WidgetViewer,
} from "../../widgets/galeria/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { GaleriaConfig, GaleriaEstado } from "./galeria-types.js";

export function GaleriaEditor({ estado, config }: ElementEditorProps<GaleriaEstado, GaleriaConfig>) {
  return <WidgetEditor estado={estado} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

export function GaleriaViewer({ estado, config }: ElementViewerProps<GaleriaEstado, GaleriaConfig>) {
  return <WidgetViewer estado={estado} isThumbnail={config.isThumbnail === true} />;
}

export function GaleriaPropiedades({ estado, onChange }: ElementPropsPanelProps<GaleriaEstado, GaleriaConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
