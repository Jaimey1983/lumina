import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  ExternalLink,
  Flag,
  Heart,
  Info,
  Lightbulb,
  Mail,
  Play,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

/**
 * Iconos que se pueden poner en un Botón (T8). Lista cerrada y corta a propósito: importar
 * todo Lucide por nombre sumaría cientos de KB al visor del alumno.
 */
export const BOTON_ICONOS = {
  'flecha-derecha': { label: 'Flecha →', Icon: ArrowRight },
  'flecha-izquierda': { label: 'Flecha ←', Icon: ArrowLeft },
  chevron: { label: 'Chevron ›', Icon: ChevronRight },
  descargar: { label: 'Descargar', Icon: Download },
  enlace: { label: 'Enlace externo', Icon: ExternalLink },
  reproducir: { label: 'Reproducir', Icon: Play },
  check: { label: 'Check', Icon: Check },
  mas: { label: 'Más', Icon: Plus },
  info: { label: 'Información', Icon: Info },
  ayuda: { label: 'Ayuda', Icon: CircleHelp },
  estrella: { label: 'Estrella', Icon: Star },
  corazon: { label: 'Corazón', Icon: Heart },
  correo: { label: 'Correo', Icon: Mail },
  enviar: { label: 'Enviar', Icon: Send },
  cohete: { label: 'Cohete', Icon: Rocket },
  libro: { label: 'Libro', Icon: BookOpen },
  idea: { label: 'Idea', Icon: Lightbulb },
  trofeo: { label: 'Trofeo', Icon: Trophy },
  bandera: { label: 'Bandera', Icon: Flag },
  destellos: { label: 'Destellos', Icon: Sparkles },
} as const satisfies Record<string, { label: string; Icon: LucideIcon }>;

export type BotonIconoId = keyof typeof BOTON_ICONOS;

export function esIconoValido(id: unknown): id is BotonIconoId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(BOTON_ICONOS, id);
}
