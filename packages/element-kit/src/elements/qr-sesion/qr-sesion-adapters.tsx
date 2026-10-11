import {
  QrSesionEditor as WidgetEditor,
  QrSesionProperties as WidgetProperties,
  QrSesionViewer as WidgetViewer,
} from "../../widgets/qr-sesion/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { QrSesionConfig, QrSesionEstado } from "./qr-sesion-types.js";

export function QrSesionEditor({ estado, config }: ElementEditorProps<QrSesionEstado, QrSesionConfig>) {
  return <WidgetEditor estado={estado} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

export function QrSesionViewer({ estado, config }: ElementViewerProps<QrSesionEstado, QrSesionConfig>) {
  return <WidgetViewer estado={estado} isThumbnail={config.isThumbnail === true} />;
}

export function QrSesionPropiedades({ estado, onChange }: ElementPropsPanelProps<QrSesionEstado, QrSesionConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
