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
    estadoPatch: {
      configuracion: {
        tamanoPunto: "mediano",
        triggerEvento: "click",
        efectoApertura: "slide-up",
      },
    },
  },
  {
    id: "hover-sutil",
    label: "Paso de Cursor (Hover)",
    description: "Apertura rápida al pasar el puntero",
    estadoPatch: {
      configuracion: {
        tamanoPunto: "mediano",
        triggerEvento: "hover",
        efectoApertura: "fade",
      },
    },
  },
  {
    id: "destacado-grande",
    label: "Pin Destacado Grande",
    description: "Marcador de mayor visibilidad para diagramas complejos",
    estadoPatch: {
      configuracion: {
        tamanoPunto: "grande",
        triggerEvento: "click",
        efectoApertura: "slide-up",
      },
    },
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
  // Etapa K / K3: eventos que este elemento emite por `config.emitir`.
  eventos: ["clic", "visitado", "hover_entra", "hover_sale"],
  presets: HOTSPOT_PRESETS,
} as const satisfies ElementDefinition<HotspotEstado, HotspotConfig>;

export type HotspotDefinition = typeof hotspotDefinition;

