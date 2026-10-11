import type { ReactElement } from "react";
import type { EstadoObjeto } from "@lumina/types/interaction";
import type { SelloEstado } from "./sello-types.js";
import { SelloView } from "./sello-view.js";

export function SelloViewer({
  estado,
  isThumbnail = false,
  estadoObjeto,
}: {
  estado: SelloEstado;
  isThumbnail?: boolean;
  estadoObjeto?: EstadoObjeto;
}): ReactElement {
  return <SelloView estado={estado} isThumbnail={isThumbnail} estadoObjeto={estadoObjeto} />;
}
