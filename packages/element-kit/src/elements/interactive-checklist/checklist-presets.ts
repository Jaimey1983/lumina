import type { ElementPreset } from "@lumina/element-kit-core";
import type { ChecklistEstado } from "./checklist-types.js";

export const CHECKLIST_PRESETS: readonly ElementPreset<ChecklistEstado>[] = [
  {
    id: "procedimiento-guiado",
    label: "Procedimiento Guiado",
    description: "Tarjetas individuales con descripciones y barra de progreso",
    patch: {
      configuracion: {
        estiloVisual: "tarjetas",
        mostrarBarraProgreso: true,
        mostrarContador: true,
        mostrarCelebracion: true,
      },
    } as unknown as Partial<ChecklistEstado>,
  },
  {
    id: "lista-numerada",
    label: "Pasos Numerados",
    description: "Formato secuencial con indicador numérico por paso",
    patch: {
      configuracion: {
        estiloVisual: "numerado",
        mostrarBarraProgreso: true,
        mostrarContador: true,
      },
    } as unknown as Partial<ChecklistEstado>,
  },
  {
    id: "revision-compacta",
    label: "Revisión Compacta",
    description: "Lista minimalista de alta densidad para rúbricas rápidas",
    patch: {
      configuracion: {
        estiloVisual: "minimal",
        mostrarBarraProgreso: false,
        mostrarContador: true,
        mostrarCelebracion: false,
      },
    } as unknown as Partial<ChecklistEstado>,
  },
  {
    id: "reto-celebracion",
    label: "Reto con Insignia",
    description: "Énfasis en gamificación con felicitación al completar al 100%",
    patch: {
      configuracion: {
        estiloVisual: "tarjetas",
        mostrarBarraProgreso: true,
        mostrarContador: true,
        mostrarCelebracion: true,
        permitirReinicio: true,
      },
    } as unknown as Partial<ChecklistEstado>,
  },
];
