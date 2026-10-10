import type { ElementPreset } from "@lumina/element-kit-core";
import type { ScratchCardEstado } from "./scratch-card-types.js";

export const SCRATCH_CARD_PRESETS: readonly ElementPreset<ScratchCardEstado>[] = [
  {
    id: "plateado-clasico",
    label: "Plateado Clásico",
    description: "Cobertura gris plateada con texto de respuesta oculta",
    estadoPatch: {
      configuracion: {
        contenidoTipo: "texto",
        colorCobertura: "#94a3b8",
        textoCobertura: "Rasca para ver la respuesta",
        grosorPincel: 32,
        umbralAutoRevelado: 45,
      },
    },
  },
  {
    id: "dorado-premio",
    label: "Dorado / Recompensa",
    description: "Cobertura dorada con insignia de felicitación e insignia",
    estadoPatch: {
      configuracion: {
        contenidoTipo: "premio",
        colorCobertura: "#eab308",
        textoCobertura: "¡Rasca para reclamar tu premio!",
        grosorPincel: 36,
        umbralAutoRevelado: 40,
      },
    },
  },
  {
    id: "pista-misteriosa",
    label: "Pista de Escape Room",
    description: "Cobertura oscura de misterio con texto secreto de pista",
    estadoPatch: {
      configuracion: {
        contenidoTipo: "texto",
        colorCobertura: "#1e293b",
        textoCobertura: "Pista confidencial (Rasca para leer)",
        grosorPincel: 28,
        umbralAutoRevelado: 50,
      },
    },
  },
  {
    id: "imagen-oculta",
    label: "Descubrir Imagen",
    description: "Cobertura suave que revela un diagrama o fotografía",
    estadoPatch: {
      configuracion: {
        contenidoTipo: "imagen",
        colorCobertura: "#64748b",
        textoCobertura: "Rasca para revelar la imagen",
        grosorPincel: 40,
        umbralAutoRevelado: 55,
      },
    },
  },
];
