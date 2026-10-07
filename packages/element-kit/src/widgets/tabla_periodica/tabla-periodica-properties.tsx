'use client';

import type { Block } from '@lumina/types/slide';
import type { TablaPeriodicaWidget } from '@lumina/types/widget';
import { Button } from '@lumina/ui/button';
import { FieldHelp } from '@lumina/ui/field-help';
import { Label } from '@lumina/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lumina/ui/select';
import { WidgetDraftTextField } from '@lumina/editor-shared/panel-only-field';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';

import { normalizeTablaPeriodicaWidget } from './tabla-periodica-config.js';

export function TablaPeriodicaProperties({
  block,
  applyNow,
}: {
  block: TablaPeriodicaWidget;
  applyNow: (fn: (b: Block) => Block) => void | Promise<void>;
}) {
  const widget = normalizeTablaPeriodicaWidget(block);
  const cfg = widget.configuracion;

  const update = (fn: (w: TablaPeriodicaWidget) => TablaPeriodicaWidget) => {
    void applyNow((b) =>
      b.tipo === 'tabla_periodica' ? fn(normalizeTablaPeriodicaWidget(b)) : b,
    );
  };

  const patchConfig = (patch: Partial<typeof cfg>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  const copiarCe = async () => {
    const sym = widget.seleccionado?.trim();
    if (!sym) return;
    const latex = `\\ce{${sym}}`;
    try {
      await navigator.clipboard.writeText(latex);
    } catch {
      /* entorno sin clipboard */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Encabezado</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <WidgetDraftTextField
              value={widget.tituloWidget}
              onChange={(tituloWidget) => update((w) => ({ ...w, tituloWidget }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtítulo</Label>
            <WidgetDraftTextField
              value={widget.subtituloWidget}
              onChange={(subtituloWidget) => update((w) => ({ ...w, subtituloWidget }))}
              multiline
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Instrucción</Label>
            <WidgetDraftTextField
              value={widget.instruccion}
              onChange={(instruccion) => update((w) => ({ ...w, instruccion }))}
              multiline
            />
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Filtros y mapa</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label className="text-xs">Tipo de elemento</Label>
            <Select
              value={cfg.filtroCategoria}
              onValueChange={(v) =>
                patchConfig({
                  filtroCategoria: v as typeof cfg.filtroCategoria,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="metal">Metales</SelectItem>
                <SelectItem value="no_metal">No metales</SelectItem>
                <SelectItem value="metaloide">Metaloides</SelectItem>
                <SelectItem value="gas_noble">Gases nobles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Bloque</Label>
            <Select
              value={cfg.filtroBloque}
              onValueChange={(v) =>
                patchConfig({ filtroBloque: v as typeof cfg.filtroBloque })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="s">s</SelectItem>
                <SelectItem value="p">p</SelectItem>
                <SelectItem value="d">d</SelectItem>
                <SelectItem value="f">f</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Mapa de calor</Label>
            <Select
              value={cfg.heatmapPropiedad}
              onValueChange={(v) =>
                patchConfig({
                  heatmapPropiedad: v as typeof cfg.heatmapPropiedad,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Ninguna</SelectItem>
                <SelectItem value="masa_atomica">Masa atómica</SelectItem>
                <SelectItem value="grupo">Grupo</SelectItem>
                <SelectItem value="periodo">Período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <WidgetSectionTitle>Ecuación</WidgetSectionTitle>
        <div className="space-y-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void copiarCe()}>
            Copiar notación \\ce al portapapeles
          </Button>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            Cómo usar la notación
            <FieldHelp label="Notación química">
              <p>
                Selecciona un elemento en la tabla y pega el LaTeX en un bloque ecuación (pestaña
                Química del compositor).
              </p>
            </FieldHelp>
          </div>
        </div>
      </div>
    </div>
  );
}
