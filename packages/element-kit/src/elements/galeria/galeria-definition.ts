import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultGaleriaBlock } from "../../widgets/galeria/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { GaleriaEditor, GaleriaPropiedades, GaleriaViewer } from "./galeria-adapters.js";
import { GALERIA_TIPO, type GaleriaConfig, type GaleriaEstado } from "./galeria-types.js";

/** Presets de disposición y densidad; ninguno toca las imágenes. */
export const GALERIA_PRESETS: readonly ElementPreset<GaleriaEstado>[] = [
  {
    id: "rejilla",
    label: "Rejilla",
    description: "Celdas iguales en 3 columnas",
    estadoPatch: { configuracion: { disposicion: "rejilla", columnas: 3, proporcion: "horizontal", espacio: 8 } },
  },
  {
    id: "rejilla-compacta",
    label: "Rejilla compacta",
    description: "4 columnas cuadradas y juntas, para muchas imágenes",
    estadoPatch: { configuracion: { disposicion: "rejilla", columnas: 4, proporcion: "cuadrada", espacio: 4 } },
  },
  {
    id: "rejilla-amplia",
    label: "Rejilla amplia",
    description: "2 columnas grandes con aire entre ellas",
    estadoPatch: { configuracion: { disposicion: "rejilla", columnas: 2, proporcion: "panoramica", espacio: 16 } },
  },
  {
    id: "mosaico",
    label: "Mosaico",
    description: "Columnas que respetan la altura de cada imagen",
    estadoPatch: { configuracion: { disposicion: "mosaico", columnas: 3, espacio: 8 } },
  },
  {
    id: "tira",
    label: "Tira",
    description: "Una fila que se desplaza de lado, con pie de foto",
    estadoPatch: { configuracion: { disposicion: "tira", proporcion: "horizontal", espacio: 8, mostrarTitulos: true } },
  },
];

/** T17 — Galería / lightbox: widget de solo lectura, sin puntuación (DT7). */
export const galeriaDefinition = {
  tipo: GALERIA_TIPO,
  crearPorDefecto: () => createDefaultGaleriaBlock(),
  Editor: GaleriaEditor,
  Viewer: GaleriaViewer,
  Propiedades: GaleriaPropiedades,
  apariencia: { color: true, tipografia: false, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["galeria"],
  presets: GALERIA_PRESETS,
} as const satisfies ElementDefinition<GaleriaEstado, GaleriaConfig>;

export type GaleriaDefinition = typeof galeriaDefinition;
