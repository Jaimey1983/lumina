import {
  CHECKLIST_TIPO,
  type ChecklistConfiguracion,
  type ChecklistEstado,
  type ChecklistItem,
} from "./checklist-types.js";

export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "item-1",
    texto: "Revisar los conceptos introductorios",
    descripcion: "Leer la sección teórica antes de iniciar el procedimiento.",
    completadoPorDefecto: false,
  },
  {
    id: "item-2",
    texto: "Preparar el entorno de trabajo",
    descripcion: "Verificar las herramientas y materiales necesarios.",
    completadoPorDefecto: false,
  },
  {
    id: "item-3",
    texto: "Ejecutar la práctica guiada",
    descripcion: "Completar los pasos del experimento o ejercicio.",
    completadoPorDefecto: false,
  },
  {
    id: "item-4",
    texto: "Comprobar los resultados obtenidos",
    descripcion: "Contrastar los datos con la hipótesis inicial.",
    completadoPorDefecto: false,
  },
];

export const DEFAULT_CHECKLIST_CONFIG: ChecklistConfiguracion = {
  items: DEFAULT_CHECKLIST_ITEMS,
  mostrarBarraProgreso: true,
  mostrarContador: true,
  permitirReinicio: true,
  mostrarCelebracion: true,
  mensajeCelebracion: "¡Excelente trabajo! Has completado todos los pasos.",
  estiloVisual: "tarjetas",
};

export function createDefaultChecklistBlock(): ChecklistEstado {
  return {
    tipo: CHECKLIST_TIPO,
    x: 10,
    y: 10,
    ancho: 80,
    alto: 80,
    tituloWidget: "Lista de Verificación",
    subtituloWidget: "Sigue los pasos y marca cada casilla a medida que avances.",
    instruccion: "Haz clic en cada elemento para marcarlo como completado.",
    configuracion: { ...DEFAULT_CHECKLIST_CONFIG },
  };
}
