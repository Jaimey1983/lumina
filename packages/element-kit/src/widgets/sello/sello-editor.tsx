import type { ReactElement } from "react";
import type { SelloEstado } from "./sello-types.js";
import { SelloView } from "./sello-view.js";

/** En el lienzo se previsualiza el estado elegido en el panel («ganado» / «bloqueado»). */
export function SelloEditor({
  estado,
  onEnsureBlockSelected,
}: {
  estado: SelloEstado;
  onEnsureBlockSelected?: () => void;
}): ReactElement {
  return <SelloView estado={estado} editor onSeleccionar={onEnsureBlockSelected} />;
}
