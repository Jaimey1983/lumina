import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultTimelineBlock } from "../../widgets/timeline/index.js";
import { TIMELINE_VARIANTES } from "../../widgets/timeline/timeline-variant-meta.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  TimelineEditor,
  TimelineViewer,
  TimelinePropiedades,
} from "./timeline-adapters.js";
import {
  TIMELINE_TIPO,
  type TimelineEstado,
  type TimelineConfig,
} from "./timeline-types.js";

const PRESETS_VARIANTES: readonly ElementPreset<TimelineEstado>[] =
  TIMELINE_VARIANTES.map((v) => ({
    id: v.id,
    label: v.label,
    description: v.description,
    estadoPatch: {
      configuracion: {
        variante: v.id,
      },
    },
  }));

/**
 * T14 — orientación, densidad y animación. Solo parchean las opciones nuevas, así que se
 * combinan con cualquiera de las 8 variantes de arriba (que no se tocan).
 */
const ESTILOS_T14: readonly ElementPreset<TimelineEstado>[] = [
  {
    id: "eje-vertical",
    label: "Eje vertical",
    description: "La línea baja y las tarjetas van a izquierda y derecha",
    estadoPatch: { configuracion: { orientacion: "vertical" } },
  },
  {
    id: "compacta",
    label: "Compacta",
    description: "Menos espacio entre tarjetas y conectores, para muchos hitos",
    estadoPatch: { configuracion: { densidad: "compacta" } },
  },
  {
    id: "amplia",
    label: "Amplia",
    description: "Más aire entre tarjetas, conectores y nodos",
    estadoPatch: { configuracion: { densidad: "amplia" } },
  },
  {
    id: "entrada-animada",
    label: "Entrada animada",
    description: "Los hitos aparecen uno tras otro al llegar al slide",
    estadoPatch: { configuracion: { animacion: "subir" } },
  },
];

export const TIMELINE_PRESETS: readonly ElementPreset<TimelineEstado>[] = [
  ...PRESETS_VARIANTES,
  ...ESTILOS_T14,
];

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const timelineDefinition = {
  tipo: TIMELINE_TIPO,
  crearPorDefecto: () => createDefaultTimelineBlock(),
  Editor: TimelineEditor,
  Viewer: TimelineViewer,
  Propiedades: TimelinePropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["timeline"],
  presets: TIMELINE_PRESETS,
} as const satisfies ElementDefinition<TimelineEstado, TimelineConfig>;

export type TimelineDefinition = typeof timelineDefinition;
