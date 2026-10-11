import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultFlipCardsBlock } from "../../widgets/flip-cards/index.js";
import { FLIP_CARDS_PLANTILLAS } from "../../widgets/flip-cards/flip-cards-templates.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  FlipCardsEditor,
  FlipCardsViewer,
  FlipCardsPropiedades,
} from "./flip-cards-adapters.js";
import {
  FLIP_CARDS_TIPO,
  type FlipCardsEstado,
  type FlipCardsConfig,
} from "./flip-cards-types.js";

const PRESETS_PLANTILLAS: readonly ElementPreset<FlipCardsEstado>[] =
  FLIP_CARDS_PLANTILLAS.map((tpl) => ({
    id: tpl.id,
    label: tpl.label,
    description: tpl.description,
    estadoPatch: {
      configuracion: {
        ...tpl.configuracion,
        plantillaId: tpl.id,
      },
      ...(tpl.estilosHeader ? { estilosHeader: tpl.estilosHeader } : {}),
    },
  }));

/**
 * T11 — estilos de giro y modo mazo. Solo parchean las opciones nuevas: las 8 plantillas de
 * arriba (colores) siguen siendo las mismas y se combinan con estas.
 */
const ESTILOS_T11: readonly ElementPreset<FlipCardsEstado>[] = [
  {
    id: "giro-vertical",
    label: "Giro vertical",
    description: "La tarjeta rota sobre el eje horizontal, con perspectiva marcada",
    estadoPatch: { configuracion: { giro: "x", profundidad: true } },
  },
  {
    id: "deslizar",
    label: "Deslizar",
    description: "El reverso entra empujando al frente, sin 3D",
    estadoPatch: { configuracion: { giro: "deslizar" } },
  },
  {
    id: "fundido",
    label: "Fundido",
    description: "El frente se desvanece y deja ver el reverso",
    estadoPatch: { configuracion: { giro: "fundido" } },
  },
  {
    id: "mazo",
    label: "Mazo",
    description: "Una tarjeta a la vez; se desliza para pasar a la siguiente",
    estadoPatch: { configuracion: { modo: "mazo", giro: "y", profundidad: true } },
  },
  {
    id: "entrada-escalonada",
    label: "Entrada escalonada",
    description: "Las tarjetas aparecen una tras otra",
    estadoPatch: { configuracion: { entradaEscalonada: true } },
  },
];

export const FLIP_CARDS_PRESETS: readonly ElementPreset<FlipCardsEstado>[] = [
  ...PRESETS_PLANTILLAS,
  ...ESTILOS_T11,
];

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const flipCardsDefinition = {
  tipo: FLIP_CARDS_TIPO,
  crearPorDefecto: () => createDefaultFlipCardsBlock(),
  Editor: FlipCardsEditor,
  Viewer: FlipCardsViewer,
  Propiedades: FlipCardsPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["flip-cards"],
  presets: FLIP_CARDS_PRESETS,
} as const satisfies ElementDefinition<FlipCardsEstado, FlipCardsConfig>;

export type FlipCardsDefinition = typeof flipCardsDefinition;
