import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  Columns2,
  GalleryHorizontal,
  GitCommitHorizontal,
  Hand,
  Layers,
  MessageSquare,
  MousePointer2,
  PanelTop,
  RotateCw,
  Target,
  Timer,
} from 'lucide-react';

import { WIDGET_LABELS, WIDGET_TIPOS, type WidgetTipo } from '@/components/widgets/shared/widget-registry';

export type WidgetPanelGroup = 'lienzo' | 'overlay' | 'control';

export const WIDGET_PANEL_GROUP_ORDER: WidgetPanelGroup[] = ['lienzo', 'overlay', 'control'];

export const WIDGET_PANEL_GROUP_LABELS: Record<WidgetPanelGroup, string> = {
  lienzo: 'Lienzo',
  overlay: 'Overlay',
  control: 'Control',
};

export interface WidgetPanelItem {
  type: WidgetTipo;
  label: string;
  Icon: LucideIcon;
  group: WidgetPanelGroup;
  rowClassName?: string;
  iconClassName?: string;
}

type WidgetPanelMeta = Omit<WidgetPanelItem, 'type' | 'label'>;

const WIDGET_PANEL_META: Record<WidgetTipo, WidgetPanelMeta> = {
  'flip-cards': {
    group: 'lienzo',
    Icon: Layers,
    rowClassName: 'hover:bg-sky-50/90 dark:hover:bg-sky-950/25',
    iconClassName: 'text-sky-600 dark:text-sky-400',
  },
  tabs: {
    group: 'lienzo',
    Icon: PanelTop,
    rowClassName: 'hover:bg-indigo-50/90 dark:hover:bg-indigo-950/25',
    iconClassName: 'text-indigo-600 dark:text-indigo-400',
  },
  carousel: {
    group: 'lienzo',
    Icon: GalleryHorizontal,
    rowClassName: 'hover:bg-violet-50/90 dark:hover:bg-violet-950/25',
    iconClassName: 'text-violet-600 dark:text-violet-400',
  },
  'click-reveal': {
    group: 'lienzo',
    Icon: Hand,
    rowClassName: 'hover:bg-amber-50/90 dark:hover:bg-amber-950/25',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  timeline: {
    group: 'lienzo',
    Icon: GitCommitHorizontal,
    rowClassName: 'hover:bg-emerald-50/90 dark:hover:bg-emerald-950/25',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  ruleta: {
    group: 'lienzo',
    Icon: RotateCw,
    rowClassName: 'hover:bg-fuchsia-50/90 dark:hover:bg-fuchsia-950/25',
    iconClassName: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  popup: {
    group: 'overlay',
    Icon: AppWindow,
    rowClassName: 'hover:bg-orange-50/90 dark:hover:bg-orange-950/25',
    iconClassName: 'text-orange-600 dark:text-orange-400',
  },
  hotspot: {
    group: 'control',
    Icon: Target,
    rowClassName: 'hover:bg-rose-50/90 dark:hover:bg-rose-950/25',
    iconClassName: 'text-rose-600 dark:text-rose-400',
  },
  tooltip: {
    group: 'control',
    Icon: MessageSquare,
    rowClassName: 'hover:bg-cyan-50/90 dark:hover:bg-cyan-950/25',
    iconClassName: 'text-cyan-600 dark:text-cyan-400',
  },
  boton: {
    group: 'control',
    Icon: MousePointer2,
    rowClassName: 'hover:bg-blue-50/90 dark:hover:bg-blue-950/25',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  contador: {
    group: 'control',
    Icon: Timer,
    rowClassName: 'hover:bg-teal-50/90 dark:hover:bg-teal-950/25',
    iconClassName: 'text-teal-600 dark:text-teal-400',
  },
  progreso: {
    group: 'control',
    Icon: Columns2,
    rowClassName: 'hover:bg-lime-50/90 dark:hover:bg-lime-950/25',
    iconClassName: 'text-lime-600 dark:text-lime-400',
  },
};

export const WIDGET_PANEL_ITEMS: WidgetPanelItem[] = WIDGET_TIPOS.map((type) => ({
  type,
  label: WIDGET_LABELS[type],
  ...WIDGET_PANEL_META[type],
}));

export function getWidgetPanelItem(type: WidgetTipo): WidgetPanelItem | undefined {
  return WIDGET_PANEL_ITEMS.find((item) => item.type === type);
}

export function getWidgetPanelItemsByGroup(group: WidgetPanelGroup): WidgetPanelItem[] {
  return WIDGET_PANEL_ITEMS.filter((item) => item.group === group);
}
