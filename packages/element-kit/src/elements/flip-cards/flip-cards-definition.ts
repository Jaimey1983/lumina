import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultFlipCardsBlock } from "lumina-frontend/widgets/flip-cards";
import type { ElementDefinition } from "@lumina/element-kit-core";
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

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const flipCardsDefinition = {
  tipo: FLIP_CARDS_TIPO,
  crearPorDefecto: () => createDefaultFlipCardsBlock(),
  Editor: FlipCardsEditor,
  Viewer: FlipCardsViewer,
  Propiedades: FlipCardsPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["flip-cards"],
} as const satisfies ElementDefinition<FlipCardsEstado, FlipCardsConfig>;

export type FlipCardsDefinition = typeof flipCardsDefinition;
