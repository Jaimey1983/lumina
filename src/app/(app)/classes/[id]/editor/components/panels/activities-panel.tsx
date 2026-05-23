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
  PanelTop,
  GalleryHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { DraggableActivityItem } from '../draggable-activity-item';
import { DraggableWidgetItem } from '../draggable-widget-item';

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
  | 'escape_room';

export type WidgetType = 'flip-cards' | 'tabs' | 'carousel';

interface ActivityItem {
  type: ActivityType;
  label: string;
  Icon: LucideIcon;
  /** Estilos extra para la fila (p. ej. acento ámbar/dorado). */
  rowClassName?: string;
  iconClassName?: string;
}

interface WidgetItem {
  type: WidgetType;
  label: string;
  Icon: LucideIcon;
  rowClassName?: string;
  iconClassName?: string;
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

const LIVE: ActivityItem[] = [
  { type: 'live-poll',  label: 'Encuesta en vivo', Icon: Radio },
  { type: 'word-cloud', label: 'Nube de palabras', Icon: Wind },
  {
    type: 'torneo',
    label: 'Torneo de preguntas',
    Icon: Trophy,
    rowClassName: 'hover:bg-amber-50/90 dark:hover:bg-amber-950/25',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  {
    type: 'escape_room',
    label: 'Escape Room',
    Icon: Lock,
    rowClassName: 'hover:bg-violet-50/90 dark:hover:bg-violet-950/25',
    iconClassName: 'text-violet-600 dark:text-violet-400',
  },
];

const WIDGETS: WidgetItem[] = [
  {
    type: 'flip-cards',
    label: 'Flip Cards',
    Icon: Layers,
    rowClassName: 'hover:bg-sky-50/90 dark:hover:bg-sky-950/25',
    iconClassName: 'text-sky-600 dark:text-sky-400',
  },
  {
    type: 'tabs',
    label: 'Tabs',
    Icon: PanelTop,
    rowClassName: 'hover:bg-indigo-50/90 dark:hover:bg-indigo-950/25',
    iconClassName: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    type: 'carousel',
    label: 'Carousel',
    Icon: GalleryHorizontal,
    rowClassName: 'hover:bg-violet-50/90 dark:hover:bg-violet-950/25',
    iconClassName: 'text-violet-600 dark:text-violet-400',
  },
];

export const ALL_ACTIVITY_ITEMS: ActivityItem[] = [
  ...EVALUATION,
  ...INTERACTION,
  ...LIVE,
];

export function getActivityPanelItem(type: ActivityType): ActivityItem | undefined {
  return ALL_ACTIVITY_ITEMS.find((item) => item.type === type);
}

export function getWidgetPanelItem(type: WidgetType): WidgetItem | undefined {
  return WIDGETS.find((item) => item.type === type);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onAddActivity: (type: ActivityType) => void;
  onAddWidget?: (type: WidgetType) => void;
  hasActivity?: boolean;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function ActivityGroup({
  title,
  items,
  onAdd,
  disabled,
}: {
  title: string;
  items: ActivityItem[];
  onAdd: (type: ActivityType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item) => (
        <DraggableActivityItem
          key={item.type}
          type={item.type}
          label={item.label}
          Icon={item.Icon}
          disabled={disabled}
          onAdd={onAdd}
          rowClassName={item.rowClassName}
          iconClassName={item.iconClassName}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function WidgetGroup({
  title,
  items,
  onAdd,
  disabled,
}: {
  title: string;
  items: WidgetItem[];
  onAdd: (type: WidgetType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item) => (
        <DraggableWidgetItem
          key={item.type}
          type={item.type}
          label={item.label}
          Icon={item.Icon}
          disabled={disabled}
          onAdd={onAdd}
          rowClassName={item.rowClassName}
          iconClassName={item.iconClassName}
        />
      ))}
    </div>
  );
}

export function ActivitiesPanel({ onAddActivity, onAddWidget, hasActivity }: Props) {
  const handleAddWidget = onAddWidget ?? (() => {});

  return (
    <div className="flex flex-col pb-4">
      {hasActivity && (
        <p className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      <WidgetGroup
        title="Widgets"
        items={WIDGETS}
        onAdd={handleAddWidget}
        disabled={hasActivity}
      />
      <ActivityGroup title="Evaluación"  items={EVALUATION}  onAdd={onAddActivity} disabled={hasActivity} />
      <ActivityGroup title="Interacción" items={INTERACTION} onAdd={onAddActivity} disabled={hasActivity} />
      <ActivityGroup title="En vivo"     items={LIVE}        onAdd={onAddActivity} disabled={hasActivity} />
    </div>
  );
}
