'use client';

import type { ComponentType } from 'react';
import { BarChart, Film, MonitorPlay, QrCode, Table } from 'lucide-react';
import { toast } from 'sonner';

import type { WidgetTipo } from '@lumina/types/widget';
import { ScrollArea } from '@lumina/ui/scroll-area';
import { Button } from '@lumina/ui/button';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { DraggableWidgetItem } from '../draggable-widget-item';
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

export function WidgetsInsertPanel({ disabled, slideHasActivity, onAddWidget }: Props) {
  const allDisabled = disabled || !!slideHasActivity;
  const handleAdd = onAddWidget ?? (() => {});

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="flex flex-col pb-4">
        {slideHasActivity && (
          <p className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Elimina la actividad para agregar widgets.
          </p>
        )}

        {WIDGET_PANEL_GROUP_ORDER.map((group) => {
          const items = getWidgetPanelItemsByGroup(group);
          if (items.length === 0) return null;
          return (
            <CollapsibleSection
              key={group}
              title={WIDGET_PANEL_GROUP_LABELS[group]}
              storageKey={`widgets.${group}`}
              defaultOpen={GRUPOS_ABIERTOS.includes(group)}
              badge={items.length}
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

        <CollapsibleSection
          title="Próximamente"
          storageKey="widgets.proximamente"
          defaultOpen={false}
          badge={5}
          className="px-4 pt-3"
        >
          <div className="space-y-2">
            <UpcomingBtn label="Iframe embebido" icon={MonitorPlay} disabled={allDisabled} />
            <UpcomingBtn label="GIF animado" icon={Film} disabled={allDisabled} />
            <UpcomingBtn label="Código QR" icon={QrCode} disabled={allDisabled} />
            <UpcomingBtn label="Gráfico de barras" icon={BarChart} disabled={allDisabled} />
            <UpcomingBtn label="Tabla de datos" icon={Table} disabled={allDisabled} />
          </div>
        </CollapsibleSection>
      </div>
    </ScrollArea>
  );
}
