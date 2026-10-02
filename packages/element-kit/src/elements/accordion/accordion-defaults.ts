import type { BlockMarco } from "@lumina/types/slide";
import {
  ACCORDION_TIPO,
  type AccordionConfiguracion,
  type AccordionEstado,
  type AccordionSeccion,
} from "./accordion-types.js";

export const DEFAULT_ACCORDION_SECCIONES: AccordionSeccion[] = [
  {
    id: "seccion-1",
    titulo: "¿Qué es el pensamiento crítico?",
    contenido:
      "Es la capacidad de analizar y evaluar la consistencia de los razonamientos, en especial aquellas afirmaciones que la sociedad acepta como verdaderas en el contexto de la vida cotidiana.",
    abiertoPorDefecto: true,
  },
  {
    id: "seccion-2",
    titulo: "¿Cuáles son las habilidades esenciales?",
    contenido:
      "Incluyen la observación perspicaz, la formulación de preguntas pertinentes, el análisis objetivo de evidencias, la inferencia lógica y la metacognición consciente.",
    abiertoPorDefecto: false,
  },
  {
    id: "seccion-3",
    titulo: "¿Cómo aplicarlo en la resolución de problemas?",
    contenido:
      "Definiendo con claridad el desafío central, contrastando múltiples hipótesis alternativas, mitigando sesgos cognitivos propios y monitoreando reflexivamente cada conclusión.",
    abiertoPorDefecto: false,
  },
];

export const DEFAULT_ACCORDION_CONFIG: AccordionConfiguracion = {
  secciones: DEFAULT_ACCORDION_SECCIONES,
  modo: "exclusivo",
  permitirColapsarTodo: true,
  estiloVisual: "tarjetas",
  posicionIcono: "derecha",
  tamanoIcono: "md",
  animacionExpandir: true,
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  mostrarImagenes: true,
};

export function createDefaultAccordionBlock(
  marco?: BlockMarco,
): AccordionEstado {
  return {
    tipo: ACCORDION_TIPO,
    x: marco ? marco.izquierdaPct : 10,
    y: marco ? marco.arribaPct : 10,
    ancho: marco ? marco.anchoPct : 80,
    alto: marco ? marco.altoPct : 80,
    tituloWidget: "Acordeón Interactivo",
    subtituloWidget: "Explora cada sección haciendo clic en los encabezados.",
    instruccion: "Despliega los paneles para profundizar en los conceptos clave.",
    configuracion: {
      ...DEFAULT_ACCORDION_CONFIG,
      secciones: [...DEFAULT_ACCORDION_SECCIONES],
    },
  };
}
