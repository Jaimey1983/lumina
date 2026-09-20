import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultCarouselBlock } from "../../widgets/carousel/index.js";
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

export const CAROUSEL_PRESETS = [
  {
    id: "estandar-dots",
    label: "Puntos Inferiores",
    description: "Navegación limpia mediante puntos y flechas internas",
    patch: {
      configuracion: {
        mostrarDots: true,
        mostrarTabsPagina: false,
        mostrarFlechasInternas: true,
      },
    },
  },
  {
    id: "tabs-superiores",
    label: "Pestañas Superiores",
    description: "Selector horizontal de páginas arriba y flechas internas",
    patch: {
      configuracion: {
        mostrarTabsPagina: true,
        mostrarDots: false,
        mostrarFlechasInternas: true,
      },
    },
  },
  {
    id: "minimal-flechas",
    label: "Minimalista",
    description: "Solo flechas de avance sin indicadores adicionales",
    patch: {
      configuracion: {
        mostrarDots: false,
        mostrarTabsPagina: false,
        mostrarFlechasInternas: true,
      },
    },
  },
] as const;

/** E3.3 — familia Lienzo/Captivate, sin puntuación. */
export const carouselDefinition = {
  tipo: CAROUSEL_TIPO,
  crearPorDefecto: () => createDefaultCarouselBlock(),
  Editor: CarouselEditor,
  Viewer: CarouselViewer,
  Propiedades: CarouselPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["carousel"],
  presets: CAROUSEL_PRESETS,
} as const satisfies ElementDefinition<CarouselEstado, CarouselConfig>;

export type CarouselDefinition = typeof carouselDefinition;

