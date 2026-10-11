import {
  CalloutEditor as WidgetEditor,
  CalloutProperties as WidgetProperties,
  CalloutViewer as WidgetViewer,
} from "../../widgets/callout/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { CalloutConfig, CalloutEstado } from "./callout-types.js";

export function CalloutEditor({ estado, config }: ElementEditorProps<CalloutEstado, CalloutConfig>) {
  return <WidgetEditor estado={estado} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

export function CalloutViewer({ estado }: ElementViewerProps<CalloutEstado, CalloutConfig>) {
  return <WidgetViewer estado={estado} />;
}

export function CalloutPropiedades({ estado, onChange }: ElementPropsPanelProps<CalloutEstado, CalloutConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
