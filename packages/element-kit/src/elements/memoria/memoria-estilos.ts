import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { MemoriaEstado } from "./memoria-types.js";

/**
 * U8 — estilos de Memoria: además de los ajustes del estilo, cada uno trae el color del
 * dorso de las cartas (un dato propio de Memoria, guardado en el slide).
 */
export const PRESETS_MEMORIA = crearPresetsDeEstilo<MemoriaEstado>(CAPACIDADES_AJUSTES.memoria!, {
  escolar: { configuracion: { colorDorso: "#2563EB", colorSimboloDorso: "#FFFFFF" } },
  examen: { configuracion: { colorDorso: "#1E3A8A", colorSimboloDorso: "#FFFFFF" } },
  arcade: { configuracion: { colorDorso: "#7C3AED", colorSimboloDorso: "#FDE68A" } },
  minimal: { configuracion: { colorDorso: "#6B7280", colorSimboloDorso: "#FFFFFF" } },
  pizarra: { configuracion: { colorDorso: "#2F5D46", colorSimboloDorso: "#F1F5F9" } },
});
