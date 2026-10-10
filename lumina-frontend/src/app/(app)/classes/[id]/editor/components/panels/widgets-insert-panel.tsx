'use client';

import { useState, type ComponentType } from 'react';
import { BarChart, Film, MonitorPlay, QrCode, Table } from 'lucide-react';
import { toast } from 'sonner';

import type { WidgetTipo } from '@lumina/types/widget';
import { ScrollArea } from '@lumina/ui/scroll-area';
import { Button } from '@lumina/ui/button';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { DraggableWidgetItem } from '../draggable-widget-item';
import { PanelSearch, PanelSearchEmpty, matchesQuery } from './panel-shared';
import {
  WIDGET_PANEL_GROUP_LABELS,
  WIDGET_PANEL_GROUP_ORDER,
  type WidgetPanelGroup,
  getWidgetPanelItemsByGroup,
} from './widget-panel-catalog';

/** Grupos que arrancan abiertos; «Control» y «Próximamente» arrancan cerrados. */
const GRUPOS_ABIERTOS: WidgetPanelGroup[] = ['lienzo', 'overlay'];

interface Props {
  disabled?: boolean;
  slideHasActivity?: boolean;
  onAddWidget?: (type: WidgetTipo) => void;
}

function UpcomingBtn({
  label,
  icon: Icon,
  disabled,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto w-full items-start justify-start gap-2 py-2 text-left text-xs font-normal whitespace-normal"
      disabled={disabled}
      onClick={() => toast.info('Próximamente')}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">{label}</span>
    </Button>
  );
}

const PROXIMAMENTE_ITEMS = [
  { label: 'Iframe embebido', icon: MonitorPlay },
  { label: 'GIF animado', icon: Film },
  { label: 'Código QR', icon: QrCode },
  { label: 'Gráfico de barras', icon: BarChart },
  { label: 'Tabla de datos', icon: Table },
];

/** Grupos de widgets y «Próximamente» que coinciden con la búsqueda. */
export function filtrarWidgets(query: string) {
  const searching = query.trim() !== '';
  const hit = (text: string) => matchesQuery(text, query);
  const grupos = WIDGET_PANEL_GROUP_ORDER.map((group) => ({
    group,
    items: getWidgetPanelItemsByGroup(group).filter(
      (item) => !searching || hit(WIDGET_PANEL_GROUP_LABELS[group]) || hit(item.label),
    ),
  })).filter((g) => g.items.length > 0);
  const proximamente = PROXIMAMENTE_ITEMS.filter(
    (u) => !searching || hit('Próximamente') || hit(u.label),
  );
  return { grupos, proximamente };
}

export function WidgetsInsertPanel({ disabled, slideHasActivity, onAddWidget }: Props) {
  const allDisabled = disabled || !!slideHasActivity;
  const handleAdd = onAddWidget ?? (() => {});
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const { grupos, proximamente: PROXIMAMENTE } = filtrarWidgets(query);
  const sinResultados = searching && grupos.length === 0 && PROXIMAMENTE.length === 0;

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="flex flex-col pb-4">
        {slideHasActivity && (
          <p className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Elimina la actividad para agregar widgets.
          </p>
        )}

        <div className="px-4 pt-3">
          <PanelSearch value={query} onChange={setQuery} placeholder="Buscar widgets…" label="Buscar widgets" />
        </div>
        {sinResultados ? (
          <div className="px-4 pt-3">
            <PanelSearchEmpty query={query} />
          </div>
        ) : null}

        {grupos.map(({ group, items }) => {
          return (
            <CollapsibleSection
              key={group}
              title={WIDGET_PANEL_GROUP_LABELS[group]}
              storageKey={`widgets.${group}`}
              defaultOpen={GRUPOS_ABIERTOS.includes(group)}
              badge={items.length}
              forceOpen={searching}
              className="px-4 pt-3"
            >
              <div className="-mx-4 flex flex-col gap-0.5">
                {items.map((item) => (
                  <DraggableWidgetItem
                    key={item.type}
                    type={item.type}
                    label={item.label}
                    Icon={item.Icon}
                    disabled={allDisabled}
                    onAdd={handleAdd}
                    rowClassName={item.rowClassName}
                    iconClassName={item.iconClassName}
                  />
                ))}
              </div>
            </CollapsibleSection>
          );
        })}

        {PROXIMAMENTE.length > 0 && (
          <CollapsibleSection
            title="Próximamente"
            storageKey="widgets.proximamente"
            defaultOpen={false}
            badge={5}
            forceOpen={searching}
            className="px-4 pt-3"
          >
            <div className="space-y-2">
              {PROXIMAMENTE.map((u) => (
                <UpcomingBtn key={u.label} label={u.label} icon={u.icon} disabled={allDisabled} />
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </ScrollArea>
  );
}
