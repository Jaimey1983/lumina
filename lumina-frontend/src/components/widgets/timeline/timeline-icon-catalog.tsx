'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Book,
  Briefcase,
  Calendar,
  Camera,
  Circle,
  Globe,
  Heart,
  Lightbulb,
  MessageCircle,
  Phone,
  Printer,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import type { TimelineIconoLucide } from '@/types/widget.types';
import { TIMELINE_DEFAULT_ICONS } from './timeline-config';

export { TIMELINE_DEFAULT_ICONS };

export const TIMELINE_LUCIDE_OPTIONS: {
  id: TimelineIconoLucide;
  label: string;
}[] = [
  { id: 'circle', label: 'Círculo' },
  { id: 'star', label: 'Estrella' },
  { id: 'users', label: 'Personas' },
  { id: 'lightbulb', label: 'Idea' },
  { id: 'globe', label: 'Mundo' },
  { id: 'message-circle', label: 'Mensaje' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'camera', label: 'Cámara' },
  { id: 'book', label: 'Libro' },
  { id: 'trophy', label: 'Trofeo' },
  { id: 'heart', label: 'Corazón' },
  { id: 'zap', label: 'Rayo' },
  { id: 'target', label: 'Objetivo' },
  { id: 'briefcase', label: 'Maletín' },
  { id: 'printer', label: 'Impresora' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'none', label: 'Sin icono' },
];

const ICON_MAP: Record<Exclude<TimelineIconoLucide, 'none'>, LucideIcon> = {
  circle: Circle,
  star: Star,
  users: Users,
  lightbulb: Lightbulb,
  globe: Globe,
  'message-circle': MessageCircle,
  calendar: Calendar,
  camera: Camera,
  book: Book,
  trophy: Trophy,
  heart: Heart,
  zap: Zap,
  target: Target,
  briefcase: Briefcase,
  printer: Printer,
  phone: Phone,
};

export function TimelineLucideIcon({
  name,
  className,
  size = 18,
  style,
}: {
  name?: TimelineIconoLucide;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  if (!name || name === 'none') return null;
  const Icon = ICON_MAP[name] ?? Circle;
  return <Icon className={className} size={size} style={style} aria-hidden />;
}
