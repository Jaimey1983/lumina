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
  Plus,
  Trash2,
  Table as TableIcon,
  Palette,
  Eye,
} from 'lucide-react';
import type { Block, GraficoChartType, GraficoDatosBlock, GraficoSerie } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRAFICO_PALETAS } from './grafico-color-palettes';
import { cn } from '@/lib/utils';

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
  { type: 'radialBar', label: 'Radial', Icon: Gauge },
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
    commitChange({ ...localBlock, chartType }, true);
  };

  // Cambiar paleta de colores
  const handlePaletteChange = (colorPaleta: string) => {
    commitChange({ ...localBlock, colorPaleta }, true);
  };

  // Toggle de leyenda
  const handleLegendToggle = (mostrarLeyenda: boolean) => {
    commitChange({ ...localBlock, mostrarLeyenda }, true);
  };

  // Cambiar título
  const handleTitleChange = (titulo: string) => {
    commitChange({ ...localBlock, titulo });
  };

  // Cambiar descripción accesible
  const handleA11yChange = (descripcionAccesible: string) => {
    commitChange({ ...localBlock, descripcionAccesible });
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

  const handleAddSeries = () => {
    const nextSeries: GraficoSerie[] = [
      ...localBlock.series,
      {
        nombre: `Serie ${localBlock.series.length + 1}`,
        valores: Array.from({ length: localBlock.categorias.length }, () => 0),
      },
    ];
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

  const handleRemoveSeries = (serieIdx: number) => {
    if (localBlock.series.length <= 1) return;
    const nextSeries = localBlock.series.filter((_, idx) => idx !== serieIdx);
    commitChange({ ...localBlock, series: nextSeries }, true);
  };

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
                <span className="text-[10px] leading-none">{label}</span>
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

      {/* 3. Paleta y Leyenda */}
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
      </div>

      {/* 4. Mini-Tabla de Datos */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Datos (Mini-Tabla)
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSeries}
            className="h-6 px-2 text-[10px]"
            title="Añadir nueva serie (columna)"
          >
            <Plus className="mr-1 h-3 w-3" /> Serie
          </Button>
        </div>

        {/* Tabla responsive con scroll horizontal */}
        <div className="overflow-x-auto rounded-md border border-border/80 bg-background/50">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground">
                <th className="p-1.5 min-w-[70px] font-medium">Categoría</th>
                {localBlock.series.map((serie, sIdx) => (
                  <th key={sIdx} className="p-1.5 min-w-[75px] font-medium">
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
      </div>
    </div>
  );
}
