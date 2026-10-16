import type { ReactElement } from "react";
import { DibujoSvg } from "./dibujo-render.js";
import type { DibujoEstado } from "./dibujo-types.js";

/** Vista de solo lectura del dibujo; llena el bloque. */
export function DibujoViewer({ estado }: { estado: DibujoEstado; isThumbnail?: boolean }): ReactElement {
  return (
    <div className="h-full w-full" data-dibujo="">
      <DibujoSvg escena={estado.escena} titulo={estado.titulo} descripcion={estado.descripcionAccesible} />
    </div>
  );
}
