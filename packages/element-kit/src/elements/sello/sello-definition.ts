import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultSelloBlock } from "../../widgets/sello/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { SelloEditor, SelloPropiedades, SelloViewer } from "./sello-adapters.js";
import { SELLO_TIPO, type SelloConfig, type SelloEstado } from "./sello-types.js";

/** Presets de forma, color e icono; ninguno toca los textos ni la condición. */
export const SELLO_PRESETS: readonly ElementPreset<SelloEstado>[] = [
  {
    id: "trofeo-oro",
    label: "Trofeo de oro",
    description: "Círculo dorado con trofeo",
    estadoPatch: { configuracion: { forma: "circulo", tono: "oro", icono: "trofeo" } },
  },
  {
    id: "escudo-azul",
    label: "Escudo azul",
    description: "Escudo con medalla, para un logro de la unidad",
    estadoPatch: { configuracion: { forma: "escudo", tono: "azul", icono: "medalla" } },
  },
  {
    id: "estrella-verde",
    label: "Estrella verde",
    description: "Estrella para un reto superado",
    estadoPatch: { configuracion: { forma: "estrella", tono: "verde", icono: "estrella" } },
  },
  {
    id: "racha-roja",
    label: "Racha",
    description: "Círculo rojo con llama, para una racha de aciertos",
    estadoPatch: { configuracion: { forma: "circulo", tono: "rojo", icono: "fuego" } },
  },
  {
    id: "decorativa",
    label: "Decorativa",
    description: "Siempre ganada y sin confeti: un sello fijo en el slide",
    estadoPatch: { configuracion: { condicion: "siempre", confeti: false, animacion: false } },
  },
];

/** T19 — Sello / insignia: muestra «bloqueado / ganado» según el estado de objeto (DT7: sin puntajes). */
export const selloDefinition = {
  tipo: SELLO_TIPO,
  crearPorDefecto: () => createDefaultSelloBlock(),
  Editor: SelloEditor,
  Viewer: SelloViewer,
  Propiedades: SelloPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["sello"],
  presets: SELLO_PRESETS,
} as const satisfies ElementDefinition<SelloEstado, SelloConfig>;

export type SelloDefinition = typeof selloDefinition;
