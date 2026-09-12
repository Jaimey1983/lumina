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
  Plus,
  Trash2,
  Table as TableIcon,
  Palette,
  Eye,
  Settings2,
} from 'lucide-react';
import type { Block, GraficoChartType, GraficoDatosBlock, GraficoSerie } from '@lumina/types/slide';
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
import { LUMINA_CHART_PALETTES as GRAFICO_PALETAS } from '@lumina/charts';
import { cn } from '@lumina/ui/lib/utils';

interface GraficoPropertiesProps {
  block: GraficoDatosBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
}

const CHART_TYPES: Array<{
  type: GraficoChartType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'column', label: 'Columnas', Icon: BarChart },
  { type: 'bar', label: 'Barras', Icon: BarChartHorizontal },
  { type: 'line', label: 'Líneas', Icon: LineChart },
  { type: 'area', label: 'Área', Icon: AreaChart },
  { type: 'pie', label: 'Circular', Icon: PieChart },
  { type: 'donut', label: 'Dona', Icon: CircleDot },
  { type: 'radialBar', label: 'Radial (progreso)', Icon: Gauge },
  { type: 'combo', label: 'Combo', Icon: Layers },
  { type: 'scatter', label: 'Dispersión', Icon: ScatterChart },
  { type: 'bubble', label: 'Burbujas', Icon: Circle },
  { type: 'radar', label: 'Radar', Icon: Radar },
  { type: 'treemap', label: 'Treemap', Icon: LayoutGrid },
  { type: 'funnel', label: 'Embudo', Icon: Filter },
  { type: 'heatmap', label: 'Mapa calor', Icon: Grid },
];

export function GraficoProperties({
  block,
  applyNow,
}: GraficoPropertiesProps) {
  // Estado local para edición interactiva y debounce de datos
  const [localBlock, setLocalBlock] = useState<GraficoDatosBlock>(block);
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

  // ─── Manipulación de Categorías (Filas) ───
  const handleCategoryNameChange = (catIdx: number, newName: string) => {
    const nextCategorias = [...localBlock.categorias];
    nextCategorias[catIdx] = newName;
    commitChange({ ...localBlock, categorias: nextCategorias });
  };

  const handleAddCategory = () => {
    const nextCategorias = [...localBlock.categorias, `Cat ${localBlock.categorias.length + 1}`];
    const nextSeries = localBlock.series.map((s) => ({
      ...s,
      valores: [...s.valores, 0],
    }));
    commitChange({ ...localBlock, categorias: nextCategorias, series: nextSeries }, true);
  };

  const handleRemoveCategory = (catIdx: number) => {
    if (localBlock.categorias.length <= 1) return;
    const nextCategorias = localBlock.categorias.filter((_, idx) => idx !== catIdx);
    const nextSeries = localBlock.series.map((s) => ({
      ...s,
      valores: s.valores.filter((_, idx) => idx !== catIdx),
    }));
    commitChange({ ...localBlock, categorias: nextCategorias, series: nextSeries }, true);
  };

  // ─── Manipulación de Series (Columnas) ───
  const handleSeriesNameChange = (serieIdx: number, newName: string) => {
    const nextSeries = [...localBlock.series];
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], nombre: newName };
    commitChange({ ...localBlock, series: nextSeries });
  };

  const handleSeriesValueChange = (serieIdx: number, catIdx: number, rawVal: string) => {
    const val = Number(rawVal);
    const num = Number.isFinite(val) ? val : 0;
    const nextSeries = [...localBlock.series];
    const nextVals = [...nextSeries[serieIdx].valores];
    nextVals[catIdx] = num;
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], valores: nextVals };
    commitChange({ ...localBlock, series: nextSeries });
  };

  const handleSeriesTipoComboChange = (serieIdx: number, tipoCombo: 'column' | 'line' | 'area') => {
    const nextSeries = [...localBlock.series];
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], tipoCombo };
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  const handleSeriesEjeComboChange = (serieIdx: number, ejeCombo: 'primario' | 'secundario') => {
    const nextSeries = [...localBlock.series];
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], ejeCombo };
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  const handleAddSeries = () => {
    const isScatterOrBubble = localBlock.chartType === 'scatter' || localBlock.chartType === 'bubble';
    const nextSeries: GraficoSerie[] = [
      ...localBlock.series,
      {
        nombre: `Serie ${localBlock.series.length + 1}`,
        valores: Array.from({ length: localBlock.categorias.length }, () => 0),
        ...(isScatterOrBubble
          ? {
              puntos: [
                { x: 10, y: 20, ...(localBlock.chartType === 'bubble' ? { z: 15 } : {}) },
                { x: 20, y: 40, ...(localBlock.chartType === 'bubble' ? { z: 25 } : {}) },
              ],
            }
          : {}),
      },
    ];
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  const handleRemoveSeries = (serieIdx: number) => {
    if (localBlock.series.length <= 1) return;
    const nextSeries = localBlock.series.filter((_, idx) => idx !== serieIdx);
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  // ─── Manipulación de Puntos (Scatter / Bubble) ───
  const handlePointChange = (serieIdx: number, ptIdx: number, field: 'x' | 'y' | 'z', rawVal: string) => {
    const val = Number(rawVal);
    const num = Number.isFinite(val) ? val : 0;
    const nextSeries = [...localBlock.series];
    const puntos = [...(nextSeries[serieIdx].puntos || [])];
    puntos[ptIdx] = { ...puntos[ptIdx], [field]: num };
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], puntos };
    commitChange({ ...localBlock, series: nextSeries });
  };

  const handleAddPoint = (serieIdx: number) => {
    const nextSeries = [...localBlock.series];
    const puntos = [...(nextSeries[serieIdx].puntos || [])];
    const lastPt = puntos[puntos.length - 1];
    puntos.push({
      x: (lastPt?.x ?? 0) + 10,
      y: (lastPt?.y ?? 0) + 15,
      ...(localBlock.chartType === 'bubble' ? { z: 20 } : {}),
    });
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], puntos };
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  const handleRemovePoint = (serieIdx: number, ptIdx: number) => {
    const nextSeries = [...localBlock.series];
    const puntos = (nextSeries[serieIdx].puntos || []).filter((_, idx) => idx !== ptIdx);
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], puntos };
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  const isScatterOrBubble = localBlock.chartType === 'scatter' || localBlock.chartType === 'bubble';
  const isBubble = localBlock.chartType === 'bubble';
  const isCombo = localBlock.chartType === 'combo';
  const supportsStacking = ['column', 'bar', 'area', 'combo'].includes(localBlock.chartType);
  const supportsAxes = ['column', 'bar', 'line', 'area', 'combo', 'scatter', 'bubble'].includes(localBlock.chartType);
  const supportsOrdering = !['pie', 'donut', 'radialBar', 'treemap'].includes(localBlock.chartType);

  return (
    <div className="space-y-5 text-xs">
      {/* 1. Tipo de Gráfico */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tipo de Gráfico
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {CHART_TYPES.map(({ type, label, Icon }) => {
            const isSelected = localBlock.chartType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleChartTypeChange(type)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md border p-1.5 text-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] leading-none truncate max-w-full">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Título y Accesibilidad */}
      <div className="space-y-3">
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

      {/* 3. Paleta y Visualización General */}
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

      {/* 4. Configuración Avanzada / Ejes / Apilado */}
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

      {/* 5. Tabla de Datos */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isScatterOrBubble ? 'Puntos de Datos (X, Y)' : 'Datos (Mini-Tabla)'}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSeries}
            className="h-6 px-2 text-[10px]"
            title="Añadir nueva serie"
          >
            <Plus className="mr-1 h-3 w-3" /> Serie
          </Button>
        </div>

        {['treemap', 'funnel'].includes(localBlock.chartType) && localBlock.series.length > 1 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded-sm">
            Nota: este tipo de gráfico utiliza únicamente la primera serie para dimensionar las áreas.
          </p>
        )}

        {isScatterOrBubble ? (
          /* Editor de puntos para Scatter / Bubble */
          <div className="space-y-3">
            {localBlock.series.map((serie, sIdx) => (
              <div key={sIdx} className="rounded-md border border-border/80 bg-background/50 p-2 space-y-2">
                <div className="flex items-center justify-between gap-1 border-b border-border/40 pb-1">
                  <input
                    type="text"
                    value={serie.nombre}
                    onChange={(e) => handleSeriesNameChange(sIdx, e.target.value)}
                    className="font-semibold text-foreground bg-transparent text-xs focus:outline-hidden hover:underline"
                    title="Editar nombre de la serie"
                  />
                  {localBlock.series.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSeries(sIdx)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="Eliminar serie"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground">
                        <th className="p-1 font-medium">X</th>
                        <th className="p-1 font-medium">Y</th>
                        {isBubble && <th className="p-1 font-medium">Tamaño (Z)</th>}
                        <th className="w-6 p-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(serie.puntos || []).map((pt, ptIdx) => (
                        <tr key={ptIdx} className="border-b border-border/40 hover:bg-muted/20">
                          <td className="p-1">
                            <input
                              type="number"
                              value={pt.x}
                              onChange={(e) => handlePointChange(sIdx, ptIdx, 'x', e.target.value)}
                              className="h-6 w-full rounded border border-transparent bg-transparent px-1 text-xs text-foreground focus:border-primary focus:bg-background text-right font-mono"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={pt.y}
                              onChange={(e) => handlePointChange(sIdx, ptIdx, 'y', e.target.value)}
                              className="h-6 w-full rounded border border-transparent bg-transparent px-1 text-xs text-foreground focus:border-primary focus:bg-background text-right font-mono"
                            />
                          </td>
                          {isBubble && (
                            <td className="p-1">
                              <input
                                type="number"
                                value={pt.z ?? 10}
                                onChange={(e) => handlePointChange(sIdx, ptIdx, 'z', e.target.value)}
                                className="h-6 w-full rounded border border-transparent bg-transparent px-1 text-xs text-foreground focus:border-primary focus:bg-background text-right font-mono"
                              />
                            </td>
                          )}
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoint(sIdx, ptIdx)}
                              className="text-muted-foreground/60 hover:text-destructive p-1"
                              title="Eliminar punto"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddPoint(sIdx)}
                  className="w-full h-6 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Plus className="mr-1 h-2.5 w-2.5" /> Añadir Punto (X, Y{isBubble ? ', Z' : ''})
                </Button>
              </div>
            ))}
          </div>
        ) : (
          /* Editor de categorías y series estándar */
          <>
            <div className="overflow-x-auto rounded-md border border-border/80 bg-background/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground">
                    <th className="p-1.5 min-w-[70px] font-medium">Categoría</th>
                    {localBlock.series.map((serie, sIdx) => (
                      <th key={sIdx} className="p-1.5 min-w-[90px] font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={serie.nombre}
                              onChange={(e) => handleSeriesNameChange(sIdx, e.target.value)}
                              className="w-full bg-transparent font-semibold text-foreground focus:outline-hidden hover:underline truncate"
                              title="Clic para editar nombre de la serie"
                            />
                            {localBlock.series.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSeries(sIdx)}
                                className="text-muted-foreground hover:text-destructive shrink-0"
                                title="Eliminar serie"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>

                          {isCombo && (
                            <div className="flex gap-1">
                              <select
                                value={serie.tipoCombo || 'column'}
                                onChange={(e) => handleSeriesTipoComboChange(sIdx, e.target.value as 'column' | 'line' | 'area')}
                                className="text-[9px] bg-muted rounded px-1 py-0.5 border border-border/60"
                              >
                                <option value="column">Barras</option>
                                <option value="line">Línea</option>
                                <option value="area">Área</option>
                              </select>
                              <select
                                value={serie.ejeCombo || 'primario'}
                                onChange={(e) => handleSeriesEjeComboChange(sIdx, e.target.value as 'primario' | 'secundario')}
                                className="text-[9px] bg-muted rounded px-1 py-0.5 border border-border/60"
                              >
                                <option value="primario">Eje 1</option>
                                <option value="secundario">Eje 2</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-6 p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {localBlock.categorias.map((cat, cIdx) => (
                    <tr key={cIdx} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="p-1">
                        <input
                          type="text"
                          value={cat}
                          onChange={(e) => handleCategoryNameChange(cIdx, e.target.value)}
                          className="h-7 w-full rounded border border-transparent bg-transparent px-1.5 text-xs text-foreground focus:border-primary focus:bg-background focus:outline-hidden"
                        />
                      </td>
                      {localBlock.series.map((serie, sIdx) => (
                        <td key={sIdx} className="p-1">
                          <input
                            type="number"
                            value={serie.valores[cIdx] ?? 0}
                            onChange={(e) =>
                              handleSeriesValueChange(sIdx, cIdx, e.target.value)
                            }
                            className="h-7 w-full rounded border border-transparent bg-transparent px-1.5 text-xs text-foreground focus:border-primary focus:bg-background focus:outline-hidden text-right font-mono"
                          />
                        </td>
                      ))}
                      <td className="p-1 text-center">
                        {localBlock.categorias.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cIdx)}
                            className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddCategory}
              className="w-full h-7 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-1 h-3 w-3" /> Añadir Categoría (Fila)
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

