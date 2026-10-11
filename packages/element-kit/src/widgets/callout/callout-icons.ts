import {
  Bell,
  BookOpen,
  CircleCheck,
  CircleHelp,
  Flag,
  Flame,
  Info,
  Lightbulb,
  OctagonAlert,
  Pin,
  Star,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { CalloutTono } from "./callout-types.js";

/** Iconos disponibles (lista cerrada: no se importa todo Lucide). El id es lo que se guarda. */
export const CALLOUT_ICONOS: Record<string, { label: string; Icono: LucideIcon }> = {
  info: { label: "Información", Icono: Info },
  idea: { label: "Idea", Icono: Lightbulb },
  alerta: { label: "Alerta", Icono: TriangleAlert },
  stop: { label: "Peligro", Icono: OctagonAlert },
  check: { label: "Listo", Icono: CircleCheck },
  pregunta: { label: "Pregunta", Icono: CircleHelp },
  libro: { label: "Libro", Icono: BookOpen },
  estrella: { label: "Estrella", Icono: Star },
  pin: { label: "Recordar", Icono: Pin },
  campana: { label: "Aviso", Icono: Bell },
  bandera: { label: "Meta", Icono: Flag },
  fuego: { label: "Importante", Icono: Flame },
};

/** Icono que se usa con `icono: "auto"` para cada tono. */
export const ICONO_POR_TONO: Record<CalloutTono, string> = {
  info: "info",
  tip: "idea",
  aviso: "alerta",
  peligro: "stop",
  exito: "check",
};

export function resolverIconoCallout(icono: string, tono: CalloutTono): LucideIcon {
  const id = icono === "auto" || !(icono in CALLOUT_ICONOS) ? ICONO_POR_TONO[tono] : icono;
  return CALLOUT_ICONOS[id].Icono;
}
