import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultDibujoBlock, plantillasDibujo } from "../../widgets/dibujo/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { DibujoEditor, DibujoPropiedades, DibujoViewer } from "./dibujo-adapters.js";
import { DIBUJO_TIPO, type DibujoConfig, type DibujoEstado } from "./dibujo-types.js";

/** Plantillas de partida: cada preset reemplaza la escena y deja el título y la descripción como están. */
export const DIBUJO_PRESETS: readonly ElementPreset<DibujoEstado>[] = plantillasDibujo().map((p) => ({
  id: p.id,
  label: p.label,
  description: p.description,
  estadoPatch: { escena: p.escena } as ElementPreset<DibujoEstado>["estadoPatch"],
}));

/** W3 — Dibujo: lienzo libre de formas, líneas y texto (escena de `@lumina/drawing`). Sin puntuación todavía (W11). */
export const dibujoDefinition = {
  tipo: DIBUJO_TIPO,
  crearPorDefecto: () => createDefaultDibujoBlock(),
  Editor: DibujoEditor,
  Viewer: DibujoViewer,
  Propiedades: DibujoPropiedades,
  apariencia: { color: false, tipografia: false, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["dibujo"],
  presets: DIBUJO_PRESETS,
  // W9: el visor emite `clic` y `parte_clic` (con el id del elemento tocado) cuando hay motor de interacción.
  eventos: ["clic", "parte_clic"],
} as const satisfies ElementDefinition<DibujoEstado, DibujoConfig>;

export type DibujoDefinition = typeof dibujoDefinition;
