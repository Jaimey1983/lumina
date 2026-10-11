import {
  Award,
  BookOpen,
  Crown,
  Flame,
  Heart,
  Lightbulb,
  Medal,
  Rocket,
  Star,
  Target,
  ThumbsUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/** Iconos de la insignia (lista cerrada). El id es lo que se guarda. */
export const SELLO_ICONOS: Record<string, { label: string; Icono: LucideIcon }> = {
  trofeo: { label: "Trofeo", Icono: Trophy },
  medalla: { label: "Medalla", Icono: Medal },
  premio: { label: "Premio", Icono: Award },
  estrella: { label: "Estrella", Icono: Star },
  corona: { label: "Corona", Icono: Crown },
  cohete: { label: "Cohete", Icono: Rocket },
  fuego: { label: "Racha", Icono: Flame },
  diana: { label: "Diana", Icono: Target },
  libro: { label: "Libro", Icono: BookOpen },
  idea: { label: "Idea", Icono: Lightbulb },
  corazon: { label: "Corazón", Icono: Heart },
  pulgar: { label: "Bien hecho", Icono: ThumbsUp },
};

export const SELLO_ICONO_POR_DEFECTO = "trofeo";

export function resolverIconoSello(id: string): LucideIcon {
  return (SELLO_ICONOS[id] ?? SELLO_ICONOS[SELLO_ICONO_POR_DEFECTO]).Icono;
}
