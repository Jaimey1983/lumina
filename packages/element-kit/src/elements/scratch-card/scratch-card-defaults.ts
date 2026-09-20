import type { BlockMarco } from "@lumina/types/slide";
import {
  SCRATCH_CARD_TIPO,
  type ScratchCardConfiguracion,
  type ScratchCardEstado,
} from "./scratch-card-types.js";

export const DEFAULT_SCRATCH_CONFIG: ScratchCardConfiguracion = {
  contenidoTipo: "texto",
  textoSecreto: "¡Correcto! El proceso biológico es la Fotosíntesis.",
  imagenSecretaUrl:
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80",
  imagenSecretaAlt: "Imagen secreta revelada",
  premioTitulo: "¡Medalla de Explorador!",
  premioSubtitulo: "+50 Puntos de experiencia otorgados",
  colorCobertura: "#94a3b8", // Plateado
  textoCobertura: "Rasca aquí con el ratón o dedo para descubrir",
  grosorPincel: 32,
  umbralAutoRevelado: 45,
  permitirBotonRevelar: true,
  permitirReinicio: true,
};

export function createDefaultScratchCardBlock(
  marco?: BlockMarco,
): ScratchCardEstado {
  return {
    tipo: SCRATCH_CARD_TIPO,
    x: marco ? marco.izquierdaPct : 15,
    y: marco ? marco.arribaPct : 10,
    ancho: marco ? marco.anchoPct : 70,
    alto: marco ? marco.altoPct : 75,
    tituloWidget: "Tarjeta Rasca y Revela",
    subtituloWidget: "Piensa tu respuesta antes de descubrir el secreto.",
    instruccion: "Arrastra sobre el área plateada para raspar la superficie.",
    configuracion: { ...DEFAULT_SCRATCH_CONFIG },
  };
}
