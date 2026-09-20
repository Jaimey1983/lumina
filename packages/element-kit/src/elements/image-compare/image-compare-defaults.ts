import type { BlockMarco } from "@lumina/types/slide";
import {
  IMAGE_COMPARE_TIPO,
  type ImageCompareConfiguracion,
  type ImageCompareEstado,
} from "./image-compare-types.js";

export const DEFAULT_IMAGEN_ANTES =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
export const DEFAULT_IMAGEN_DESPUES =
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80";

export const DEFAULT_IMAGE_COMPARE_CONFIG: ImageCompareConfiguracion = {
  imagenAntesUrl: DEFAULT_IMAGEN_ANTES,
  imagenDespuesUrl: DEFAULT_IMAGEN_DESPUES,
  imagenAntesAlt: "Imagen Antes",
  imagenDespuesAlt: "Imagen Después",
  etiquetaAntes: "Antes",
  etiquetaDespues: "Después",
  posicionInicial: 50,
  orientacion: "horizontal",
  mostrarEtiquetas: true,
  estiloLinea: "solida",
  colorLinea: "#ffffff",
  mostrarBotonDeslizador: true,
};

export function createDefaultImageCompareBlock(
  marco?: BlockMarco,
): ImageCompareEstado {
  return {
    tipo: IMAGE_COMPARE_TIPO,
    x: marco ? marco.izquierdaPct : 10,
    y: marco ? marco.arribaPct : 10,
    ancho: marco ? marco.anchoPct : 80,
    alto: marco ? marco.altoPct : 75,
    tituloWidget: "Comparador de imágenes",
    subtituloWidget:
      "Desplaza la barra divisoria para observar los cambios en detalle.",
    instruccion:
      "Arrastra el deslizador central o usa las flechas del teclado.",
    configuracion: { ...DEFAULT_IMAGE_COMPARE_CONFIG },
  };
}
