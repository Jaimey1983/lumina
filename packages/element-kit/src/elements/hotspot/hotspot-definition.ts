import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultHotspotBlock } from "../../widgets/hotspot/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  HotspotEditor,
  HotspotPropiedades,
  HotspotViewer,
} from "./hotspot-adapters.js";
import { HOTSPOT_TIPO, type HotspotConfig, type HotspotEstado } from "./hotspot-types.js";

export const HOTSPOT_PRESETS: readonly ElementPreset<HotspotEstado>[] = [
  {
    id: "pulso-alerta",
    label: "Pulso Dinámico",
    description: "Punto llamativo con pulso y apertura al hacer clic",
    patch: {
      configuracion: {
        tamanoPunto: "medio",
        triggerEvento: "click",
        efectoApertura: "slide-up",
      },
    } as unknown as Partial<HotspotEstado>,
  },
  {
    id: "hover-sutil",
    label: "Paso de Cursor (Hover)",
    description: "Apertura rápida al pasar el puntero",
    patch: {
      configuracion: {
        tamanoPunto: "medio",
        triggerEvento: "hover",
        efectoApertura: "fade",
      },
    } as unknown as Partial<HotspotEstado>,
  },
  {
    id: "destacado-grande",
    label: "Pin Destacado Grande",
    description: "Marcador de mayor visibilidad para diagramas complejos",
    patch: {
      configuracion: {
        tamanoPunto: "grande",
        triggerEvento: "click",
        efectoApertura: "slide-up",
      },
    } as unknown as Partial<HotspotEstado>,
  },
];

/** E3.2 — Hotspot como ElementDefinition, sin puntuación. */
export const hotspotDefinition = {
  tipo: HOTSPOT_TIPO,
  crearPorDefecto: () => createDefaultHotspotBlock(),
  Editor: HotspotEditor,
  Viewer: HotspotViewer,
  Propiedades: HotspotPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["hotspot"],
  presets: HOTSPOT_PRESETS,
} as const satisfies ElementDefinition<HotspotEstado, HotspotConfig>;

export type HotspotDefinition = typeof hotspotDefinition;

