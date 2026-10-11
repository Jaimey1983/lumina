import type { ReactElement } from "react";
import type { QrSesionEstado } from "./qr-sesion-types.js";
import { QrSesionView } from "./qr-sesion-view.js";

export function QrSesionViewer({ estado, isThumbnail = false }: { estado: QrSesionEstado; isThumbnail?: boolean }): ReactElement {
  return <QrSesionView estado={estado} isThumbnail={isThumbnail} />;
}
