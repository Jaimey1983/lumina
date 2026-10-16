import type { ReactElement } from "react";
import { DibujoSvg } from "./dibujo-render.js";
import type { DibujoEstado } from "./dibujo-types.js";

/**
 * En el lienzo del slide se ve el dibujo. Las herramientas de edición llegan en los pasos W4–W8;
 * mientras tanto se selecciona el bloque al hacer clic, como en los demás widgets.
 */
export function DibujoEditor({ estado, onEnsureBlockSelected }: { estado: DibujoEstado; onEnsureBlockSelected?: () => void }): ReactElement {
  return (
    <div className="h-full w-full" data-dibujo="" onClick={onEnsureBlockSelected}>
      <DibujoSvg escena={estado.escena} titulo={estado.titulo} descripcion={estado.descripcionAccesible} />
    </div>
  );
}
