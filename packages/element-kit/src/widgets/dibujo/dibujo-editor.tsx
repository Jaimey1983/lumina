"use client";

import { useState, type ReactElement } from "react";
import { EditorLibreModal } from "../../elements/dibujo/editor/editor-libre-modal.js";
import { DibujoSvg } from "./dibujo-render.js";
import { normalizeDibujoWidget } from "./dibujo-defaults.js";
import type { DibujoEstado } from "./dibujo-types.js";

export interface DibujoEditorProps {
  estado: DibujoEstado;
  onChange?: (estado: DibujoEstado) => void;
  onEnsureBlockSelected?: () => void;
}

/**
 * En el lienzo del slide se ve el dibujo; con doble clic se abre el editor de pantalla casi completa
 * (dibujar en el rectángulo pequeño del bloque no es viable, DW6).
 */
export function DibujoEditor({ estado, onChange, onEnsureBlockSelected }: DibujoEditorProps): ReactElement {
  const [abierto, setAbierto] = useState(false);
  return (
    <div
      className="h-full w-full"
      data-dibujo=""
      onClick={onEnsureBlockSelected}
      onDoubleClick={onChange ? () => setAbierto(true) : undefined}
      title={onChange ? "Doble clic para editar el dibujo" : undefined}
    >
      <DibujoSvg escena={estado.escena} titulo={estado.titulo} descripcion={estado.descripcionAccesible} />
      {onChange ? (
        <EditorLibreModal
          abierto={abierto}
          escena={estado.escena}
          {...(estado.titulo !== undefined ? { titulo: estado.titulo } : {})}
          onCambio={(escena) => onChange(normalizeDibujoWidget({ ...estado, escena }))}
          onCerrar={() => setAbierto(false)}
        />
      ) : null}
    </div>
  );
}
