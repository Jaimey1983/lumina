import type { ReactElement } from "react";
import type { CalloutEstado } from "./callout-types.js";
import { CalloutView } from "./callout-view.js";

/** Visor del alumno: el Callout es solo lectura. */
export function CalloutViewer({ estado }: { estado: CalloutEstado }): ReactElement {
  return <CalloutView estado={estado} />;
}
