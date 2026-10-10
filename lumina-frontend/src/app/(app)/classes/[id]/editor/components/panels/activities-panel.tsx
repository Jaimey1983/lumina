'use client';

import {
  AlignLeft,
  CheckSquare,
  Columns2,
  GripVertical,
  ListOrdered,
  Calculator,
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
  FlaskConical,
  TableProperties,
  Atom,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { WidgetTipo } from '@lumina/types/widget';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@lumina/ui/accordion';
import { PanelSearch, PanelSearchEmpty, matchesQuery } from './panel-shared';
import { DraggableActivityItem } from '../draggable-activity-item';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'quiz-multiple'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'respuesta-matematica'
  | 'balancear-ecuacion'
  | 'ubicar-elemento'
  | 'formular-compuesto'
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
  { type: 'respuesta-matematica', label: 'Respuesta matemática', Icon: Calculator },
];

const QUIMICA: ActivityItem[] = [
  { type: 'balancear-ecuacion', label: 'Balancear ecuación', Icon: FlaskConical },
  { type: 'ubicar-elemento', label: 'Ubicar en la tabla', Icon: TableProperties },
  { type: 'formular-compuesto', label: 'Formular compuesto', Icon: Atom },
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
  ...QUIMICA,
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
  value,
  title,
  items,
  onAdd,
  disabled,
}: {
  value: string;
  title: string;
  items: ActivityItem[];
  onAdd: (type: ActivityType) => void;
  disabled?: boolean;
}) {
  return (
    <AccordionItem value={value} className="border-b-0">
      <AccordionTrigger className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex flex-1 items-center gap-1.5 text-left">
          {title}
          <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium leading-4">
            {items.length}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-1 pt-0">
        <div className="flex flex-col gap-0.5">
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
      </AccordionContent>
    </AccordionItem>
  );
}

/** Grupo que arranca abierto; el acordeón mantiene uno solo abierto a la vez. */
const GRUPO_ABIERTO_POR_DEFECTO = 'evaluacion';

const GRUPOS: Array<{ value: string; title: string; items: ActivityItem[] }> = [
  { value: 'evaluacion', title: 'Evaluación', items: EVALUATION },
  { value: 'quimica', title: 'Química', items: QUIMICA },
  { value: 'interaccion', title: 'Interacción', items: INTERACTION },
  { value: 'en-vivo', title: 'En vivo', items: LIVE },
  { value: 'juegos', title: 'Juegos', items: GRUPO4 },
];

/** Grupos de actividades con al menos una coincidencia (por grupo o por etiqueta). */
export function filtrarGruposActividades(query: string) {
  const searching = query.trim() !== '';
  return GRUPOS.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) => !searching || matchesQuery(g.title, query) || matchesQuery(i.label, query),
    ),
  })).filter((g) => g.items.length > 0);
}

export function ActivitiesPanel({ onAddActivity, hasActivity }: Props) {
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const grupos = filtrarGruposActividades(query);

  return (
    <div className="flex flex-col pb-4">
      <div className="px-3 pt-3">
        <PanelSearch value={query} onChange={setQuery} placeholder="Buscar actividades…" label="Buscar actividades" />
      </div>
      {hasActivity && (
        <p className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      {searching && grupos.length === 0 ? (
        <div className="px-3 pt-3">
          <PanelSearchEmpty query={query} />
        </div>
      ) : searching ? (
        // Con búsqueda se abren todos los grupos con coincidencias (acordeón múltiple).
        <Accordion key="busqueda" type="multiple" value={grupos.map((g) => g.value)}>
          {grupos.map((g) => (
            <ActivityGroup key={g.value} value={g.value} title={g.title} items={g.items} onAdd={onAddActivity} disabled={hasActivity} />
          ))}
        </Accordion>
      ) : (
        <Accordion key="normal" type="single" collapsible defaultValue={GRUPO_ABIERTO_POR_DEFECTO}>
          {GRUPOS.map((g) => (
            <ActivityGroup key={g.value} value={g.value} title={g.title} items={g.items} onAdd={onAddActivity} disabled={hasActivity} />
          ))}
        </Accordion>
      )}
    </div>
  );
}
