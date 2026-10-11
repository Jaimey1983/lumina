import type { ReactElement } from "react";
import type { GaleriaEstado } from "./galeria-types.js";
import { GaleriaView } from "./galeria-view.js";

export function GaleriaViewer({ estado, isThumbnail = false }: { estado: GaleriaEstado; isThumbnail?: boolean }): ReactElement {
  return <GaleriaView estado={estado} isThumbnail={isThumbnail} />;
}
