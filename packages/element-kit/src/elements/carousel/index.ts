export {
  carouselDefinition,
  type CarouselDefinition,
} from "./carousel-definition.js";
export {
  CarouselEditor,
  CarouselViewer,
  CarouselPropiedades,
} from "./carousel-adapters.js";
export {
  CAROUSEL_TIPO,
  type CarouselEstado,
  type CarouselConfig,
} from "./carousel-types.js";
export { registrarCarousel } from "./register.js";
/** Hidratación idéntica a la del widget existente. */
export { normalizeCarouselWidget } from "lumina-frontend/widgets/carousel";
