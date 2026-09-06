import { createDefaultCarouselBlock } from "lumina-frontend/widgets/carousel";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  CarouselEditor,
  CarouselViewer,
  CarouselPropiedades,
} from "./carousel-adapters.js";
import {
  CAROUSEL_TIPO,
  type CarouselEstado,
  type CarouselConfig,
} from "./carousel-types.js";

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const carouselDefinition = {
  tipo: CAROUSEL_TIPO,
  crearPorDefecto: () => createDefaultCarouselBlock(),
  Editor: CarouselEditor,
  Viewer: CarouselViewer,
  Propiedades: CarouselPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
} as const satisfies ElementDefinition<CarouselEstado, CarouselConfig>;

export type CarouselDefinition = typeof carouselDefinition;
