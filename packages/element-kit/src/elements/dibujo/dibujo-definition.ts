import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultDibujoBlock } from "../../widgets/dibujo/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { DibujoEditor, DibujoPropiedades, DibujoViewer } from "./dibujo-adapters.js";
import { DIBUJO_TIPO, type DibujoConfig, type DibujoEstado } from "./dibujo-types.js";

/** W3 — Dibujo: lienzo libre de formas, líneas y texto (escena de `@lumina/drawing`). Sin puntuación todavía (W11). */
export const dibujoDefinition = {
  tipo: DIBUJO_TIPO,
  crearPorDefecto: () => createDefaultDibujoBlock(),
  Editor: DibujoEditor,
  Viewer: DibujoViewer,
  Propiedades: DibujoPropiedades,
  apariencia: { color: false, tipografia: false, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["dibujo"],
} as const satisfies ElementDefinition<DibujoEstado, DibujoConfig>;

export type DibujoDefinition = typeof dibujoDefinition;
