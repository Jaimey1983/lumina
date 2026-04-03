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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

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
  | 'word-cloud';

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

const LIVE: ActivityItem[] = [
  { type: 'live-poll',  label: 'Encuesta en vivo', Icon: Radio },
  { type: 'word-cloud', label: 'Nube de palabras', Icon: Wind },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onAddActivity: (type: ActivityType) => void;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function ActivityGroup({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: ActivityItem[];
  onAdd: (type: ActivityType) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map(({ type, label, Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 text-left transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivitiesPanel({ onAddActivity }: Props) {
  return (
    <div className="flex flex-col pb-4">
      <ActivityGroup title="Evaluación"  items={EVALUATION}  onAdd={onAddActivity} />
      <ActivityGroup title="Interacción" items={INTERACTION} onAdd={onAddActivity} />
      <ActivityGroup title="En vivo"     items={LIVE}        onAdd={onAddActivity} />
    </div>
  );
}
