'use client';

import type { ComponentType } from 'react';
import { BarChart, Film, MonitorPlay, QrCode, Table } from 'lucide-react';
import { toast } from 'sonner';

import type { WidgetTipo } from '@/components/widgets/shared/widget-registry';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DraggableWidgetItem } from '../draggable-widget-item';
import {
  WIDGET_PANEL_GROUP_LABELS,
  WIDGET_PANEL_GROUP_ORDER,
  getWidgetPanelItemsByGroup,
} from './widget-panel-catalog';

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
      className="h-auto w-full justify-start gap-2 py-2 text-left text-xs font-normal"
      disabled={disabled}
      onClick={() => toast.info('Próximamente')}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      {label}
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
            <div key={group} className="flex flex-col gap-0.5">
              <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {WIDGET_PANEL_GROUP_LABELS[group]}
              </p>
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
          );
        })}

        <div className="space-y-2 px-3 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Próximamente
          </p>
          <UpcomingBtn label="Iframe embebido" icon={MonitorPlay} disabled={allDisabled} />
          <UpcomingBtn label="GIF animado" icon={Film} disabled={allDisabled} />
          <UpcomingBtn label="Código QR" icon={QrCode} disabled={allDisabled} />
          <UpcomingBtn label="Gráfico de barras" icon={BarChart} disabled={allDisabled} />
          <UpcomingBtn label="Tabla de datos" icon={Table} disabled={allDisabled} />
        </div>
      </div>
    </ScrollArea>
  );
}
