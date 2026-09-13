'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart,
  BarChartHorizontal,
  LineChart,
  AreaChart,
  PieChart,
  CircleDot,
  Gauge,
  Layers,
  ScatterChart,
  Circle,
  Radar,
  LayoutGrid,
  Filter,
  Grid,
  Table as TableIcon,
  Palette,
  Eye,
  Settings2,
} from 'lucide-react';
import type { Block, GraficoChartType, GraficoDatosBlock } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { Switch } from '@lumina/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lumina/ui/select';
import {
  LUMINA_CHART_FAMILIES,
  LUMINA_CHART_TYPE_META,
  LUMINA_CHART_PALETTES as GRAFICO_PALETAS,
  getChartFamily,
  getChartTypesByFamily,
  type LuminaChartFamily,
} from '@lumina/charts';
import { cn } from '@lumina/ui/lib/utils';
import { GraficoDataDialog } from './grafico-data-dialog.js';

interface GraficoPropertiesProps {
  block: GraficoDatosBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
}

const CHART_TYPE_ICONS: Record<GraficoChartType, React.ComponentType<{ className?: string }>> = {
  column: BarChart,
  bar: BarChartHorizontal,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
  donut: CircleDot,
  radialBar: Gauge,
  combo: Layers,
  scatter: ScatterChart,
  bubble: Circle,
  radar: Radar,
  treemap: LayoutGrid,
  funnel: Filter,
  heatmap: Grid,
};

export function GraficoProperties({
  block,
  applyNow,
}: GraficoPropertiesProps) {
  // Estado local para edición interactiva y debounce de datos
  const [localBlock, setLocalBlock] = useState<GraficoDatosBlock>(block);
  const [dataDialogOpen, setDataDialogOpen] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar si cambia el id del bloque seleccionado
  useEffect(() => {
    setLocalBlock(block);
  }, [block.id]);

  // Limpiar temporizador al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitChange = (updated: GraficoDatosBlock, immediate = false) => {
    setLocalBlock(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate) {
      void applyNow((b) => (b.tipo === 'grafico' && (b as GraficoDatosBlock).id === updated.id ? updated : b));
      return;
    }

    // Debounce de ~300ms (§1.13) para evitar saturación de PATCH
    debounceTimerRef.current = setTimeout(() => {
      void applyNow((b) => (b.tipo === 'grafico' && (b as GraficoDatosBlock).id === updated.id ? updated : b));
    }, 300);
  };

  // Cambiar tipo de gráfico
  const handleChartTypeChange = (chartType: GraficoChartType) => {
    // Si cambia a scatter/bubble y no hay puntos, inicializar puntos
    let series = localBlock.series;
    if ((chartType === 'scatter' || chartType === 'bubble') && (!series[0]?.puntos || series[0].puntos.length === 0)) {
      series = series.map((s) => ({
        ...s,
        puntos: [
          { x: 10, y: 20, ...(chartType === 'bubble' ? { z: 15 } : {}) },
          { x: 20, y: 45, ...(chartType === 'bubble' ? { z: 25 } : {}) },
          { x: 30, y: 30, ...(chartType === 'bubble' ? { z: 10 } : {}) },
          { x: 40, y: 70, ...(chartType === 'bubble' ? { z: 35 } : {}) },
        ],
      }));
    }
    commitChange({ ...localBlock, chartType, series }, true);
  };

  // Cambiar familia de gráfico
  const handleFamilyChange = (familyId: LuminaChartFamily) => {
    const familyMeta = LUMINA_CHART_FAMILIES.find((f) => f.id === familyId);
    if (!familyMeta) return;
    if (getChartFamily(localBlock.chartType) !== familyId) {
      handleChartTypeChange(familyMeta.defaultType);
    }
  };

  // Cambiar paleta de colores
  const handlePaletteChange = (colorPaleta: string) => {
    commitChange({ ...localBlock, colorPaleta }, true);
  };

  // Toggles generales
  const handleLegendToggle = (mostrarLeyenda: boolean) => {
    commitChange({ ...localBlock, mostrarLeyenda }, true);
  };

  const handleDataLabelsToggle = (mostrarEtiquetasDatos: boolean) => {
    commitChange({ ...localBlock, mostrarEtiquetasDatos }, true);
  };

  const handleExportImageToggle = (exportarImagen: boolean) => {
    commitChange({ ...localBlock, exportarImagen }, true);
  };

  const handleAnimationToggle = (animar: boolean) => {
    commitChange({ ...localBlock, animar }, true);
  };

  // Cambiar título
  const handleTitleChange = (titulo: string) => {
    commitChange({ ...localBlock, titulo });
  };

  // Cambiar descripción accesible
  const handleA11yChange = (descripcionAccesible: string) => {
    commitChange({ ...localBlock, descripcionAccesible });
  };

  // Configuración fina
  const handleApiladoChange = (apilado: 'ninguno' | 'normal' | 'porcentaje') => {
    commitChange({ ...localBlock, apilado: apilado === 'ninguno' ? undefined : apilado }, true);
  };

  const handleOrdenDatosChange = (ordenDatos: 'como-esta' | 'ascendente' | 'descendente') => {
    commitChange({ ...localBlock, ordenDatos: ordenDatos === 'como-esta' ? undefined : ordenDatos }, true);
  };

  const handleEjeXTituloChange = (ejeXTitulo: string) => {
    commitChange({ ...localBlock, ejeXTitulo: ejeXTitulo.trim().length > 0 ? ejeXTitulo : undefined });
  };

  const handleEjeYTituloChange = (ejeYTitulo: string) => {
    commitChange({ ...localBlock, ejeYTitulo: ejeYTitulo.trim().length > 0 ? ejeYTitulo : undefined });
  };

  const handleEjeYMinChange = (raw: string) => {
    const val = Number(raw);
    commitChange({ ...localBlock, ejeYMin: Number.isFinite(val) && raw.trim() !== '' ? val : undefined });
  };

  const handleEjeYMaxChange = (raw: string) => {
    const val = Number(raw);
    commitChange({ ...localBlock, ejeYMax: Number.isFinite(val) && raw.trim() !== '' ? val : undefined });
  };

  const handleEjeYLogToggle = (ejeYEscalaLog: boolean) => {
    commitChange({ ...localBlock, ejeYEscalaLog: ejeYEscalaLog || undefined }, true);
  };

  const handleReferenceLineValueChange = (raw: string) => {
    const val = Number(raw);
    if (!Number.isFinite(val) || raw.trim() === '') {
      commitChange({ ...localBlock, lineaReferencia: undefined });
    } else {
      commitChange({
        ...localBlock,
        lineaReferencia: {
          valor: val,
          etiqueta: localBlock.lineaReferencia?.etiqueta,
        },
      });
    }
  };

  const handleReferenceLineLabelChange = (etiqueta: string) => {
    if (localBlock.lineaReferencia) {
      commitChange({
        ...localBlock,
        lineaReferencia: {
          ...localBlock.lineaReferencia,
          etiqueta: etiqueta.trim().length > 0 ? etiqueta : undefined,
        },
      });
    }
  };

  const activeFamily = getChartFamily(localBlock.chartType);
  const activeFamilyMeta = LUMINA_CHART_FAMILIES.find((f) => f.id === activeFamily);
  const familyVariants = getChartTypesByFamily(activeFamily);

  const isScatterOrBubble = localBlock.chartType === 'scatter' || localBlock.chartType === 'bubble';
  const supportsStacking = ['column', 'bar', 'area', 'combo'].includes(localBlock.chartType);
  const supportsAxes = ['column', 'bar', 'line', 'area', 'combo', 'scatter', 'bubble'].includes(localBlock.chartType);
  const supportsOrdering = !['pie', 'donut', 'radialBar', 'treemap'].includes(localBlock.chartType);

  return (
    <div className="space-y-5 text-xs">
      {/* 1. Selector de Familia y Variantes */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Familia de Gráfico
          </Label>
          <Select
            value={activeFamily}
            onValueChange={(val) => handleFamilyChange(val as LuminaChartFamily)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecciona una familia" />
            </SelectTrigger>
            <SelectContent>
              {LUMINA_CHART_FAMILIES.map((family) => (
                <SelectItem key={family.id} value={family.id} className="text-xs py-1.5">
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-foreground">{family.label}</span>
                    <span className="text-[10px] text-muted-foreground">{family.descripcion}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variantes dentro de la familia activa */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium text-muted-foreground">
            Variantes de {activeFamilyMeta?.label || 'Familia'}
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {familyVariants.map((type) => {
              const meta = LUMINA_CHART_TYPE_META[type];
              const Icon = CHART_TYPE_ICONS[type] || BarChart;
              const isSelected = localBlock.chartType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChartTypeChange(type)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border p-2 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                  title={meta?.descripcion || meta?.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] leading-tight truncate">{meta?.label || type}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Modal de Datos */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Datos del Gráfico
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDataDialogOpen(true)}
          className="w-full h-9 flex items-center justify-between px-3 text-xs bg-muted/30 hover:bg-muted/60 border-border/80"
        >
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Abrir editor de datos</span>
          </div>
          <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
            {isScatterOrBubble
              ? `${localBlock.series.length} ${localBlock.series.length === 1 ? 'serie' : 'series'}`
              : `${localBlock.categorias.length} cat · ${localBlock.series.length} ser`}
          </span>
        </Button>

        <GraficoDataDialog
          open={dataDialogOpen}
          onOpenChange={setDataDialogOpen}
          block={localBlock}
          commitChange={commitChange}
        />
      </div>

      {/* 3. Título y Accesibilidad */}
      <div className="space-y-3 border-t border-border pt-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Título del Gráfico</Label>
          <Input
            value={localBlock.titulo || ''}
            placeholder="Ej: Comparativa de ventas"
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <Label className="text-[11px] text-muted-foreground">Descripción Accesible (A11y)</Label>
          </div>
          <Textarea
            value={localBlock.descripcionAccesible || ''}
            placeholder="Descripción para lectores de pantalla..."
            onChange={(e) => handleA11yChange(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
        </div>
      </div>

      {/* 4. Paleta y Visualización General */}
      <div className="space-y-3 border-t border-border pt-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Palette className="h-3 w-3 text-muted-foreground" />
            <Label className="text-[11px] text-muted-foreground">Paleta de Colores</Label>
          </div>
          <Select
            value={localBlock.colorPaleta || 'lumina'}
            onValueChange={handlePaletteChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecciona paleta" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(GRAFICO_PALETAS).map((paleta) => (
                <SelectItem key={paleta.id} value={paleta.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {paleta.colores.slice(0, 4).map((c, i) => (
                        <div
                          key={i}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span>{paleta.nombre}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Label className="text-[11px] text-muted-foreground">Mostrar Leyenda</Label>
          <Switch
            checked={localBlock.mostrarLeyenda !== false}
            onCheckedChange={handleLegendToggle}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Label className="text-[11px] text-muted-foreground">Etiquetas de Datos (Valores)</Label>
          <Switch
            checked={Boolean(localBlock.mostrarEtiquetasDatos)}
            onCheckedChange={handleDataLabelsToggle}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Label className="text-[11px] text-muted-foreground">Exportar Imagen (PNG/SVG)</Label>
          <Switch
            checked={localBlock.exportarImagen !== false}
            onCheckedChange={handleExportImageToggle}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Label className="text-[11px] text-muted-foreground">Animar Entrada</Label>
          <Switch
            checked={Boolean(localBlock.animar)}
            onCheckedChange={handleAnimationToggle}
          />
        </div>
      </div>

      {/* 5. Configuración Avanzada / Ejes / Apilado */}
      {(supportsStacking || supportsAxes || supportsOrdering) && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ejes y Configuración
            </span>
          </div>

          {supportsStacking && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Modo de Apilado</Label>
              <Select
                value={localBlock.apilado || 'ninguno'}
                onValueChange={handleApiladoChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sin apilado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno" className="text-xs">Sin apilar</SelectItem>
                  <SelectItem value="normal" className="text-xs">Apilado normal</SelectItem>
                  <SelectItem value="porcentaje" className="text-xs">Apilado 100% (porcentaje)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {supportsOrdering && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Orden de Datos</Label>
              <Select
                value={localBlock.ordenDatos || 'como-esta'}
                onValueChange={handleOrdenDatosChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Orden original" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="como-esta" className="text-xs">Como está (original)</SelectItem>
                  <SelectItem value="ascendente" className="text-xs">Ascendente (menor a mayor)</SelectItem>
                  <SelectItem value="descendente" className="text-xs">Descendente (mayor a menor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {supportsAxes && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Título Eje X</Label>
                  <Input
                    value={localBlock.ejeXTitulo || ''}
                    placeholder="Eje X..."
                    onChange={(e) => handleEjeXTituloChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Título Eje Y</Label>
                  <Input
                    value={localBlock.ejeYTitulo || ''}
                    placeholder="Eje Y..."
                    onChange={(e) => handleEjeYTituloChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Mínimo Eje Y</Label>
                  <Input
                    type="number"
                    value={localBlock.ejeYMin ?? ''}
                    placeholder="Auto"
                    onChange={(e) => handleEjeYMinChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Máximo Eje Y</Label>
                  <Input
                    type="number"
                    value={localBlock.ejeYMax ?? ''}
                    placeholder="Auto"
                    onChange={(e) => handleEjeYMaxChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-[10px] text-muted-foreground">Escala Logarítmica (Eje Y)</Label>
                <Switch
                  checked={Boolean(localBlock.ejeYEscalaLog)}
                  onCheckedChange={handleEjeYLogToggle}
                />
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-[10px] text-muted-foreground">Línea de Referencia / Meta</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={localBlock.lineaReferencia?.valor ?? ''}
                    placeholder="Valor (ej: 80)"
                    onChange={(e) => handleReferenceLineValueChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <Input
                    type="text"
                    value={localBlock.lineaReferencia?.etiqueta ?? ''}
                    placeholder="Etiqueta (ej: Meta)"
                    disabled={localBlock.lineaReferencia?.valor === undefined}
                    onChange={(e) => handleReferenceLineLabelChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


