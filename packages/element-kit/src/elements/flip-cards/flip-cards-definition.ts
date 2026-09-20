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

export const FLIP_CARDS_PRESETS: readonly ElementPreset<FlipCardsEstado>[] =
  FLIP_CARDS_PLANTILLAS.map((tpl) => ({
    id: tpl.id,
    label: tpl.label,
    description: tpl.description,
    patch: {
      configuracion: {
        ...tpl.configuracion,
        plantillaId: tpl.id,
      },
      ...(tpl.estilosHeader ? { estilosHeader: tpl.estilosHeader } : {}),
    } as unknown as Partial<FlipCardsEstado>,
  }));

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
