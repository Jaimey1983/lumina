import type { ElementPreset } from "@lumina/element-kit-core";
import type { ImageCompareEstado } from "./image-compare-types.js";

export const IMAGE_COMPARE_PRESETS: readonly ElementPreset<ImageCompareEstado>[] = [
  {
    id: "horizontal-clasico",
    label: "División Horizontal",
    description: "Comparación lado a lado al 50% con etiquetas fijas",
    patch: {
      configuracion: {
        orientacion: "horizontal",
        posicionInicial: 50,
        mostrarEtiquetas: true,
        estiloLinea: "solida",
        mostrarBotonDeslizador: true,
      },
    } as unknown as Partial<ImageCompareEstado>,
  },
  {
    id: "vertical-split",
    label: "División Vertical",
    description: "Comparación superior/inferior con tirador arriba y abajo",
    patch: {
      configuracion: {
        orientacion: "vertical",
        posicionInicial: 50,
        mostrarEtiquetas: true,
        estiloLinea: "solida",
        mostrarBotonDeslizador: true,
      },
    } as unknown as Partial<ImageCompareEstado>,
  },
  {
    id: "minimal-sin-etiquetas",
    label: "Minimalista",
    description: "Enfoque puramente visual sin etiquetas ni textos superpuestos",
    patch: {
      configuracion: {
        mostrarEtiquetas: false,
        estiloLinea: "discreta",
      },
    } as unknown as Partial<ImageCompareEstado>,
  },
  {
    id: "revelacion-75",
    label: "Revelación 75%",
    description: "Destaca el resultado final dejando un 25% del estado inicial",
    patch: {
      configuracion: {
        posicionInicial: 75,
        mostrarEtiquetas: true,
        mostrarBotonDeslizador: true,
      },
    } as unknown as Partial<ImageCompareEstado>,
  },
];

