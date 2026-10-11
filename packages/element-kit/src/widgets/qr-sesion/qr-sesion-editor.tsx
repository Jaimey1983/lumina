import type { ReactElement } from "react";
import type { QrSesionEstado } from "./qr-sesion-types.js";
import { QrSesionView } from "./qr-sesion-view.js";

/** En el lienzo se ve el QR tal como lo verán los alumnos; el código y las opciones se editan en el panel. */
export function QrSesionEditor({
  estado,
  onEnsureBlockSelected,
}: {
  estado: QrSesionEstado;
  onEnsureBlockSelected?: () => void;
}): ReactElement {
  return <QrSesionView estado={estado} editor onSeleccionar={onEnsureBlockSelected} />;
}
