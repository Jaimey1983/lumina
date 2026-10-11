import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultCalloutBlock } from "../../widgets/callout/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { CalloutEditor, CalloutPropiedades, CalloutViewer } from "./callout-adapters.js";
import { CALLOUT_TIPO, type CalloutConfig, type CalloutEstado } from "./callout-types.js";

/**
 * Presets: tres estilos (barra lateral / tarjeta / banda) y un preset por tipo de nota. Los de
 * tipo fijan también el título propuesto; ninguno toca el texto del cuerpo.
 */
export const CALLOUT_PRESETS: readonly ElementPreset<CalloutEstado>[] = [
  {
    id: "barra-lateral",
    label: "Barra lateral",
    description: "Franja de color a la izquierda, discreta",
    estadoPatch: { configuracion: { estilo: "barra" } },
  },
  {
    id: "tarjeta",
    label: "Tarjeta",
    description: "Recuadro con borde, sombra suave e icono en círculo",
    estadoPatch: { configuracion: { estilo: "tarjeta" } },
  },
  {
    id: "banda",
    label: "Banda",
    description: "Fondo de color pleno que destaca sobre el slide",
    estadoPatch: { configuracion: { estilo: "banda" } },
  },
  {
    id: "nota-info",
    label: "Nota informativa",
    description: "Dato o contexto para tener presente",
    estadoPatch: { configuracion: { tono: "info", titulo: "Nota" } },
  },
  {
    id: "nota-consejo",
    label: "Consejo",
    description: "Una sugerencia útil",
    estadoPatch: { configuracion: { tono: "tip", titulo: "Consejo" } },
  },
  {
    id: "nota-aviso",
    label: "Aviso",
    description: "Algo a lo que hay que prestar atención",
    estadoPatch: { configuracion: { tono: "aviso", titulo: "Ojo" } },
  },
  {
    id: "nota-peligro",
    label: "Peligro",
    description: "Un error frecuente o una acción que no se debe hacer",
    estadoPatch: { configuracion: { tono: "peligro", titulo: "Peligro" } },
  },
  {
    id: "nota-exito",
    label: "Éxito",
    description: "Refuerzo positivo o paso completado",
    estadoPatch: { configuracion: { tono: "exito", titulo: "¡Bien hecho!" } },
  },
];

/** T16 — Callout / nota: widget de solo lectura, sin puntuación (DT7). */
export const calloutDefinition = {
  tipo: CALLOUT_TIPO,
  crearPorDefecto: () => createDefaultCalloutBlock(),
  Editor: CalloutEditor,
  Viewer: CalloutViewer,
  Propiedades: CalloutPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["callout"],
  presets: CALLOUT_PRESETS,
} as const satisfies ElementDefinition<CalloutEstado, CalloutConfig>;

export type CalloutDefinition = typeof calloutDefinition;
