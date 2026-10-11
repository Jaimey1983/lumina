import {
  BookOpen,
  Calendar,
  CircleCheck,
  CircleHelp,
  Flag,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Music,
  Star,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';

/** Iconos que se pueden poner en una pestaña (T12). El id es lo que se guarda en la ficha. */
export const TABS_ICONOS: Record<string, { label: string; Icono: LucideIcon }> = {
  libro: { label: 'Libro', Icono: BookOpen },
  idea: { label: 'Idea', Icono: Lightbulb },
  estrella: { label: 'Estrella', Icono: Star },
  info: { label: 'Información', Icono: Info },
  pregunta: { label: 'Pregunta', Icono: CircleHelp },
  check: { label: 'Listo', Icono: CircleCheck },
  bandera: { label: 'Meta', Icono: Flag },
  calendario: { label: 'Calendario', Icono: Calendar },
  imagen: { label: 'Imagen', Icono: ImageIcon },
  video: { label: 'Video', Icono: Video },
  musica: { label: 'Música', Icono: Music },
  personas: { label: 'Personas', Icono: Users },
};
