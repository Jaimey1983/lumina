import type { ReactElement } from "react";
import { stopWidgetInnerPointer } from "@lumina/editor-shared/widget-editor-utils";
import type { CalloutEstado } from "./callout-types.js";
import { CalloutView } from "./callout-view.js";

/**
 * En el lienzo se ve igual que en el visor; el texto, el tono y el estilo se editan en el panel
 * de propiedades (como Botón, Contador o Acordeón). Un clic selecciona el bloque.
 */
export function CalloutEditor({
  estado,
  onEnsureBlockSelected,
}: {
  estado: CalloutEstado;
  onEnsureBlockSelected?: () => void;
}): ReactElement {
  return (
    <div
      className="h-full w-full"
      onPointerDown={(e) => {
        stopWidgetInnerPointer(e);
        onEnsureBlockSelected?.();
      }}
    >
      <CalloutView estado={estado} />
    </div>
  );
}
