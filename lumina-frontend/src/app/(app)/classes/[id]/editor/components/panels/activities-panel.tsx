'use client';

import {
  AlignLeft,
  CheckSquare,
  Columns2,
  GripVertical,
  ListOrdered,
  MessageSquare,
  Radio,
  CircleDot,
  Video,
  Wind,
  Trophy,
  Lock,
  Layers,
  Grid2x2,
  Grid3x3,
  Puzzle,
  Search,
  Package,
  CaseSensitive,
  Sparkles,
  Crosshair,
  Keyboard,
  GitBranch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { WidgetTipo } from '@/components/widgets/shared/widget-registry';
import { DraggableActivityItem } from '../draggable-activity-item';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'quiz-multiple'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'drag-drop'
  | 'match'
  | 'sort-steps'
  | 'video-interactive'
  | 'live-poll'
  | 'word-cloud'
  | 'torneo'
  | 'escape_room'
  | 'historia_ramificada'
  | 'clasificar'
  | 'memoria'
  | 'puzzle_imagen'
  | 'sopa_letras'
  | 'crucigrama'
  | 'abrir_caja'
  | 'anagrama'
  | 'ahorcado'
  | 'puzzle_palabras'
  | 'globos'
  | 'topo';

export type WidgetType = WidgetTipo;

interface ActivityItem {
  type: ActivityType;
  label: string;
  Icon: LucideIcon;
}

// ─── Activity groups ──────────────────────────────────────────────────────────

const EVALUATION: ActivityItem[] = [
  { type: 'quiz-multiple', label: 'Quiz opción múltiple', Icon: CircleDot },
  { type: 'true-false',    label: 'Verdadero / Falso',   Icon: CheckSquare },
  { type: 'fill-blank',    label: 'Llenar espacios',     Icon: AlignLeft },
  { type: 'short-answer',  label: 'Respuesta corta',     Icon: MessageSquare },
];

const INTERACTION: ActivityItem[] = [
  { type: 'drag-drop',         label: 'Drag & Drop',        Icon: GripVertical },
  { type: 'match',             label: 'Emparejar',           Icon: Columns2 },
  { type: 'sort-steps',        label: 'Ordenar pasos',       Icon: ListOrdered },
  { type: 'video-interactive', label: 'Video interactivo',   Icon: Video },
];

const GRUPO4: ActivityItem[] = [
  { type: 'clasificar',       label: 'Clasificar',          Icon: Layers },
  { type: 'memoria',          label: 'Memoria',             Icon: Grid2x2 },
  { type: 'puzzle_imagen',    label: 'Puzzle de imagen',    Icon: Puzzle },
  { type: 'sopa_letras',      label: 'Sopa de letras',      Icon: Search },
  { type: 'crucigrama',       label: 'Crucigrama',          Icon: Grid3x3 },
  { type: 'abrir_caja',       label: 'Abrir caja',          Icon: Package },
  { type: 'anagrama',         label: 'Anagrama',            Icon: CaseSensitive },
  { type: 'ahorcado',         label: 'Ahorcado',            Icon: Keyboard },
  { type: 'puzzle_palabras',  label: 'Puzzle de palabras',  Icon: AlignLeft },
  { type: 'globos',           label: 'Globos',              Icon: Sparkles },
  { type: 'topo',             label: 'Golpea al topo',      Icon: Crosshair },
];

const LIVE: ActivityItem[] = [
  { type: 'live-poll',            label: 'Encuesta en vivo',     Icon: Radio },
  { type: 'word-cloud',           label: 'Nube de palabras',     Icon: Wind },
  { type: 'torneo',               label: 'Torneo de preguntas',  Icon: Trophy },
  { type: 'escape_room',          label: 'Escape Room',          Icon: Lock },
  { type: 'historia_ramificada',  label: 'Historia Ramificada',  Icon: GitBranch },
];

export const ALL_ACTIVITY_ITEMS: ActivityItem[] = [
  ...EVALUATION,
  ...INTERACTION,
  ...LIVE,
  ...GRUPO4,
];

export function getActivityPanelItem(type: ActivityType): ActivityItem | undefined {
  return ALL_ACTIVITY_ITEMS.find((item) => item.type === type);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onAddActivity: (type: ActivityType) => void;
  hasActivity?: boolean;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function ActivityGroup({
  title,
  items,
  onAdd,
  disabled,
}: {
  title?: string;
  items: ActivityItem[];
  onAdd: (type: ActivityType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {title ? (
        <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      ) : null}
      {items.map((item) => (
        <DraggableActivityItem
          key={item.type}
          type={item.type}
          label={item.label}
          Icon={item.Icon}
          disabled={disabled}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

export function ActivitiesPanel({ onAddActivity, hasActivity }: Props) {
  return (
    <div className="flex flex-col pb-4">
      {hasActivity && (
        <p className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      <ActivityGroup title="Evaluación"  items={EVALUATION}  onAdd={onAddActivity} disabled={hasActivity} />
      <ActivityGroup title="Interacción" items={INTERACTION} onAdd={onAddActivity} disabled={hasActivity} />
      <ActivityGroup title="En vivo"     items={LIVE}        onAdd={onAddActivity} disabled={hasActivity} />
      <ActivityGroup items={GRUPO4} onAdd={onAddActivity} disabled={hasActivity} />
    </div>
  );
}
