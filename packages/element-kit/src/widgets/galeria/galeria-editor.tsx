import type { ReactElement } from "react";
import type { GaleriaEstado } from "./galeria-types.js";
import { GaleriaView } from "./galeria-view.js";

/** En el lienzo se ve la galería (sin lightbox) y se marcan las imágenes sin texto alternativo; todo se edita en el panel. */
export function GaleriaEditor({
  estado,
  onEnsureBlockSelected,
}: {
  estado: GaleriaEstado;
  onEnsureBlockSelected?: () => void;
}): ReactElement {
  return <GaleriaView estado={estado} editor onSeleccionar={onEnsureBlockSelected} />;
}
