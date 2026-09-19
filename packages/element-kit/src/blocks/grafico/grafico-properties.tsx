'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart,
  BarChart2,
  BarChartHorizontal,
  LineChart,
  AreaChart,
  PieChart,
  CircleDot,
  Disc,
  Gauge,
  Layers,
  ScatterChart,
  Circle,
  Radar,
  LayoutGrid,
  Filter,
  Grid,
  Boxes,
  Sigma,
  Table as TableIcon,
  Palette,
  Eye,
  Settings2,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
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
  generarResumenAccesible,
  type LuminaChartFamily,
  type LuminaChartConfig,
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
  polarArea: Disc,
  radialBar: Gauge,
  combo: Layers,
  waterfall: BarChart2,
  scatter: ScatterChart,
  bubble: Circle,
  radar: Radar,
  treemap: LayoutGrid,
  funnel: Filter,
  heatmap: Grid,
  boxPlot: Boxes,
  histogram: Sigma,
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

  // Generar automáticamente la descripción accesible a partir de los datos (Etapa I7)
  const handleGenerarResumenAccesible = () => {
    const config: LuminaChartConfig = {
      type: localBlock.chartType,
      categorias: localBlock.categorias,
      series: localBlock.series,
      histogramBins: localBlock.histogramBins,
    };
    const resumen = generarResumenAccesible(config);
    commitChange({ ...localBlock, descripcionAccesible: resumen }, true);
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

  // Líneas de referencia (Etapa I5 — arreglo, 0 o más)
  const handleAddLineaReferencia = () => {
    const nextLineas = [...(localBlock.lineasReferencia ?? []), { valor: 0 }];
    commitChange({ ...localBlock, lineasReferencia: nextLineas }, true);
  };

  const handleLineaReferenciaValueChange = (idx: number, raw: string) => {
    const val = Number(raw);
    const nextLineas = [...(localBlock.lineasReferencia ?? [])];
    nextLineas[idx] = { ...nextLineas[idx], valor: Number.isFinite(val) ? val : 0 };
    commitChange({ ...localBlock, lineasReferencia: nextLineas });
  };

  const handleLineaReferenciaLabelChange = (idx: number, etiqueta: string) => {
    const nextLineas = [...(localBlock.lineasReferencia ?? [])];
    nextLineas[idx] = { ...nextLineas[idx], etiqueta: etiqueta.trim().length > 0 ? etiqueta : undefined };
    commitChange({ ...localBlock, lineasReferencia: nextLineas });
  };

  const handleLineaReferenciaColorChange = (idx: number, color: string) => {
    const nextLineas = [...(localBlock.lineasReferencia ?? [])];
    nextLineas[idx] = { ...nextLineas[idx], color };
    commitChange({ ...localBlock, lineasReferencia: nextLineas }, true);
  };

  const handleRemoveLineaReferencia = (idx: number) => {
    const nextLineas = (localBlock.lineasReferencia ?? []).filter((_, i) => i !== idx);
    commitChange({ ...localBlock, lineasReferencia: nextLineas.length > 0 ? nextLineas : undefined }, true);
  };

  // Bandas de referencia (Etapa I5 — rango sombreado, 0 o más)
  const handleAddBanda = () => {
    const nextBandas = [...(localBlock.bandas ?? []), { desde: 0, hasta: 0 }];
    commitChange({ ...localBlock, bandas: nextBandas }, true);
  };

  const handleBandaFieldChange = (idx: number, field: 'desde' | 'hasta', raw: string) => {
    const val = Number(raw);
    const nextBandas = [...(localBlock.bandas ?? [])];
    nextBandas[idx] = { ...nextBandas[idx], [field]: Number.isFinite(val) ? val : 0 };
    commitChange({ ...localBlock, bandas: nextBandas });
  };

  const handleBandaLabelChange = (idx: number, etiqueta: string) => {
    const nextBandas = [...(localBlock.bandas ?? [])];
    nextBandas[idx] = { ...nextBandas[idx], etiqueta: etiqueta.trim().length > 0 ? etiqueta : undefined };
    commitChange({ ...localBlock, bandas: nextBandas });
  };

  const handleBandaColorChange = (idx: number, color: string) => {
    const nextBandas = [...(localBlock.bandas ?? [])];
    nextBandas[idx] = { ...nextBandas[idx], color };
    commitChange({ ...localBlock, bandas: nextBandas }, true);
  };

  const handleRemoveBanda = (idx: number) => {
    const nextBandas = (localBlock.bandas ?? []).filter((_, i) => i !== idx);
    commitChange({ ...localBlock, bandas: nextBandas.length > 0 ? nextBandas : undefined }, true);
  };

  // Estilo visual general (Etapa I5)
  const updateEstilo = (patch: Partial<NonNullable<GraficoDatosBlock['estilo']>>, immediate = false) => {
    commitChange({ ...localBlock, estilo: { ...localBlock.estilo, ...patch } }, immediate);
  };

  const handleEstiloEsquinasChange = (raw: string) => {
    const val = Number(raw);
    updateEstilo({ esquinas: Number.isFinite(val) && raw.trim() !== '' ? val : undefined });
  };

  const handleEstiloSombraToggle = (sombra: boolean) => updateEstilo({ sombra: sombra || undefined }, true);

  const handleEstiloFuenteChange = (fuente: string) => {
    updateEstilo({ fuente: fuente.trim().length > 0 ? fuente : undefined });
  };

  const handleEstiloFondoChange = (fondo: 'transparente' | 'tarjeta') => {
    updateEstilo({ fondo: fondo === 'transparente' ? undefined : fondo }, true);
  };

  const handleEstiloDuracionChange = (raw: string) => {
    const val = Number(raw);
    updateEstilo({ duracionAnimacion: Number.isFinite(val) && raw.trim() !== '' ? val : undefined });
  };

  // Paleta personalizada (Etapa I5)
  const handleAddPaletaColor = () => {
    const nextPaleta = [...(localBlock.paletaPersonalizada ?? []), '#3B82F6'];
    commitChange({ ...localBlock, paletaPersonalizada: nextPaleta }, true);
  };

  const handlePaletaColorChange = (idx: number, color: string) => {
    const nextPaleta = [...(localBlock.paletaPersonalizada ?? [])];
    nextPaleta[idx] = color;
    commitChange({ ...localBlock, paletaPersonalizada: nextPaleta }, true);
  };

  const handleRemovePaletaColor = (idx: number) => {
    const nextPaleta = (localBlock.paletaPersonalizada ?? []).filter((_, i) => i !== idx);
    commitChange({ ...localBlock, paletaPersonalizada: nextPaleta.length > 0 ? nextPaleta : undefined }, true);
  };

  const handleCurvaChange = (curva: 'suave' | 'recta' | 'escalon') => {
    commitChange({ ...localBlock, curva: curva === 'suave' ? undefined : curva }, true);
  };

  const handleModoSparklineToggle = (modoSparkline: boolean) => {
    commitChange({ ...localBlock, modoSparkline: modoSparkline || undefined }, true);
  };

  const handleMostrarTotalToggle = (mostrarTotal: boolean) => {
    commitChange({ ...localBlock, mostrarTotal: mostrarTotal || undefined }, true);
  };

  const handleAnguloChange = (angulo: 'completo' | 'semicirculo') => {
    commitChange({ ...localBlock, angulo: angulo === 'completo' ? undefined : angulo }, true);
  };

  const handleHistogramBinsChange = (raw: string) => {
    const val = Number(raw);
    commitChange(
      { ...localBlock, histogramBins: Number.isFinite(val) && raw.trim() !== '' ? Math.round(val) : undefined },
      true,
    );
  };

  // Ejes, formato y leyenda (Etapa I4)
  const handleFormatoValorChange = (formatoValor: GraficoDatosBlock['formatoValor'] | 'decimal') => {
    commitChange({ ...localBlock, formatoValor: formatoValor === 'decimal' ? undefined : formatoValor }, true);
  };

  const handleEjeXRotacionChange = (raw: string) => {
    const val = Number(raw);
    commitChange({ ...localBlock, ejeXRotacion: Number.isFinite(val) && raw.trim() !== '' ? val : undefined }, true);
  };

  const handleEjeXOcultoToggle = (ejeXOculto: boolean) => {
    commitChange({ ...localBlock, ejeXOculto: ejeXOculto || undefined }, true);
  };

  const handleEjeYOcultoToggle = (ejeYOculto: boolean) => {
    commitChange({ ...localBlock, ejeYOculto: ejeYOculto || undefined }, true);
  };

  const handleGrillasChange = (grillas: 'ambas' | 'y' | 'ninguna') => {
    commitChange({ ...localBlock, grillas: grillas === 'ambas' ? undefined : grillas }, true);
  };

  const handlePosicionLeyendaChange = (posicionLeyenda: 'arriba' | 'abajo' | 'izquierda' | 'derecha') => {
    commitChange({ ...localBlock, posicionLeyenda }, true);
  };

  const activeFamily = getChartFamily(localBlock.chartType);
  const activeFamilyMeta = LUMINA_CHART_FAMILIES.find((f) => f.id === activeFamily);
  const familyVariants = getChartTypesByFamily(activeFamily);

  const isScatterOrBubble = localBlock.chartType === 'scatter' || localBlock.chartType === 'bubble';
  const isBoxPlot = localBlock.chartType === 'boxPlot';
  const isHistogram = localBlock.chartType === 'histogram';
  const supportsStacking = ['column', 'bar', 'area', 'combo'].includes(localBlock.chartType);
  const supportsAxes = ['column', 'bar', 'line', 'area', 'combo', 'scatter', 'bubble', 'waterfall', 'boxPlot', 'histogram'].includes(localBlock.chartType);
  const supportsOrdering = !['pie', 'donut', 'radialBar', 'treemap', 'waterfall', 'boxPlot', 'histogram'].includes(localBlock.chartType);
  const supportsCurva = ['line', 'area', 'combo'].includes(localBlock.chartType);
  const supportsSparkline = ['column', 'bar', 'line', 'area'].includes(localBlock.chartType);
  const supportsAngulo = ['pie', 'donut', 'radialBar'].includes(localBlock.chartType);
  const supportsTotal = localBlock.chartType === 'donut';
  const supportsLeyenda = !['treemap', 'funnel', 'waterfall', 'histogram'].includes(localBlock.chartType);
  const supportsGrillas = ['column', 'bar', 'line', 'area', 'combo', 'scatter', 'bubble', 'funnel', 'heatmap', 'waterfall', 'boxPlot', 'histogram'].includes(localBlock.chartType);

  return (
    <div className="space-y-5 text-xs">
      {/* 1. Variantes de la familia activa, con cambio de familia como acción secundaria */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
            <Label className="text-[10px] font-medium text-muted-foreground">
              Variantes de {activeFamilyMeta?.label || 'Familia'}
            </Label>
            <Select
              value={activeFamily}
              onValueChange={(val) => handleFamilyChange(val as LuminaChartFamily)}
            >
              <SelectTrigger
                size="sm"
                className="h-6 w-auto gap-1 border-none bg-transparent px-1.5 text-[10px] font-normal text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground [&>span]:line-clamp-none"
                title="Cambiar la familia de gráfico"
              >
                <SelectValue placeholder="Cambiar familia">Cambiar familia</SelectValue>
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
              : isBoxPlot
                ? `${localBlock.categorias.length} grupo${localBlock.categorias.length === 1 ? '' : 's'} · ${localBlock.series.length} ser`
                : isHistogram
                  ? `${localBlock.series[0]?.valores.length ?? 0} datos`
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
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <Label className="text-[11px] text-muted-foreground">Descripción Accesible (A11y)</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerarResumenAccesible}
              className="h-6 px-1.5 text-[10px] text-primary hover:text-primary"
              title="Genera una sugerencia a partir de los datos del gráfico — la puedes editar después"
            >
              <Wand2 className="mr-1 h-3 w-3" /> Generar automáticamente
            </Button>
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

        {supportsLeyenda && localBlock.mostrarLeyenda !== false && (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Posición de la Leyenda</Label>
            <Select
              value={localBlock.posicionLeyenda || (localBlock.chartType === 'radialBar' ? 'derecha' : 'abajo')}
              onValueChange={(val) => handlePosicionLeyendaChange(val as 'arriba' | 'abajo' | 'izquierda' | 'derecha')}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Abajo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arriba" className="text-xs">Arriba</SelectItem>
                <SelectItem value="abajo" className="text-xs">Abajo</SelectItem>
                <SelectItem value="izquierda" className="text-xs">Izquierda</SelectItem>
                <SelectItem value="derecha" className="text-xs">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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

        {supportsTotal && (
          <div className="flex items-center justify-between pt-1">
            <Label className="text-[11px] text-muted-foreground">Mostrar Total en el Centro</Label>
            <Switch
              checked={Boolean(localBlock.mostrarTotal)}
              onCheckedChange={handleMostrarTotalToggle}
            />
          </div>
        )}

        {supportsSparkline && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <Label className="text-[11px] text-muted-foreground">Modo Sparkline (Compacto)</Label>
              <span className="text-[10px] text-muted-foreground/70">Oculta ejes y grillas para tarjetas KPI</span>
            </div>
            <Switch
              checked={Boolean(localBlock.modoSparkline)}
              onCheckedChange={handleModoSparklineToggle}
            />
          </div>
        )}
      </div>

      {/* 5. Configuración Avanzada / Ejes / Apilado / Curvas */}
      {(supportsStacking || supportsAxes || supportsOrdering || supportsCurva || supportsAngulo || isHistogram || supportsGrillas) && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ejes y Configuración
            </span>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Formato Numérico (Eje / Tooltip)</Label>
            <Select
              value={localBlock.formatoValor || 'decimal'}
              onValueChange={(val) => handleFormatoValorChange(val as GraficoDatosBlock['formatoValor'])}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Decimal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decimal" className="text-xs">Decimal</SelectItem>
                <SelectItem value="entero" className="text-xs">Entero</SelectItem>
                <SelectItem value="porcentaje" className="text-xs">Porcentaje</SelectItem>
                <SelectItem value="moneda" className="text-xs">Moneda (COP)</SelectItem>
                <SelectItem value="escala0a5" className="text-xs">Escala 0–5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {supportsGrillas && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Líneas de Grilla</Label>
              <Select
                value={localBlock.grillas || 'ambas'}
                onValueChange={(val) => handleGrillasChange(val as 'ambas' | 'y' | 'ninguna')}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Ambas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambas" className="text-xs">Ambas (X e Y)</SelectItem>
                  <SelectItem value="y" className="text-xs">Solo horizontal (Y)</SelectItem>
                  <SelectItem value="ninguna" className="text-xs">Ninguna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isHistogram && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Número de Intervalos (Bins)</Label>
              <Input
                type="number"
                min={2}
                max={20}
                value={localBlock.histogramBins ?? ''}
                placeholder="Auto (8)"
                onChange={(e) => handleHistogramBinsChange(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}

          {supportsCurva && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Interpolación de Curva</Label>
              <Select
                value={localBlock.curva || 'suave'}
                onValueChange={(val) => handleCurvaChange(val as 'suave' | 'recta' | 'escalon')}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Suave (por defecto)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suave" className="text-xs">Curva suave (interpolada)</SelectItem>
                  <SelectItem value="recta" className="text-xs">Línea recta (segmentos)</SelectItem>
                  <SelectItem value="escalon" className="text-xs">Escalón (stepline)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {supportsAngulo && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Apertura Angular</Label>
              <Select
                value={localBlock.angulo || 'completo'}
                onValueChange={(val) => handleAnguloChange(val as 'completo' | 'semicirculo')}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Círculo completo (360°)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completo" className="text-xs">Círculo completo (360°)</SelectItem>
                  <SelectItem value="semicirculo" className="text-xs">Semicírculo (180° / Medidor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Rotación Eje X (°)</Label>
                  <Input
                    type="number"
                    value={localBlock.ejeXRotacion ?? ''}
                    placeholder="Auto"
                    onChange={(e) => handleEjeXRotacionChange(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex flex-col justify-end gap-1">
                  <Label className="text-[10px] text-muted-foreground">&nbsp;</Label>
                  <div className="flex items-center justify-between h-7">
                    <span className="text-[10px] text-muted-foreground">Ocultar Eje X</span>
                    <Switch
                      checked={Boolean(localBlock.ejeXOculto)}
                      onCheckedChange={handleEjeXOcultoToggle}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-[10px] text-muted-foreground">Ocultar Eje Y</Label>
                <Switch
                  checked={Boolean(localBlock.ejeYOculto)}
                  onCheckedChange={handleEjeYOcultoToggle}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-[10px] text-muted-foreground">Escala Logarítmica (Eje Y)</Label>
                <Switch
                  checked={Boolean(localBlock.ejeYEscalaLog)}
                  onCheckedChange={handleEjeYLogToggle}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Líneas de Referencia / Meta</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineaReferencia}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir
                  </Button>
                </div>
                {(localBlock.lineasReferencia ?? []).map((linea, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={linea.color || '#94a3b8'}
                      onChange={(e) => handleLineaReferenciaColorChange(idx, e.target.value)}
                      className="h-7 w-6 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0"
                      title="Color de la línea"
                    />
                    <Input
                      type="number"
                      value={linea.valor}
                      placeholder="Valor (ej: 80)"
                      onChange={(e) => handleLineaReferenciaValueChange(idx, e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="text"
                      value={linea.etiqueta ?? ''}
                      placeholder="Etiqueta (ej: Meta)"
                      onChange={(e) => handleLineaReferenciaLabelChange(idx, e.target.value)}
                      className="h-7 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineaReferencia(idx)}
                      className="shrink-0 p-1 text-muted-foreground/70 hover:text-destructive"
                      title="Eliminar línea"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Bandas de Referencia (Rango)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddBanda}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Añadir
                  </Button>
                </div>
                {(localBlock.bandas ?? []).map((banda, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={banda.color || '#ef4444'}
                      onChange={(e) => handleBandaColorChange(idx, e.target.value)}
                      className="h-7 w-6 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0"
                      title="Color de la banda"
                    />
                    <Input
                      type="number"
                      value={banda.desde}
                      placeholder="Desde"
                      onChange={(e) => handleBandaFieldChange(idx, 'desde', e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      value={banda.hasta}
                      placeholder="Hasta"
                      onChange={(e) => handleBandaFieldChange(idx, 'hasta', e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="text"
                      value={banda.etiqueta ?? ''}
                      placeholder="Etiqueta"
                      onChange={(e) => handleBandaLabelChange(idx, e.target.value)}
                      className="h-7 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBanda(idx)}
                      className="shrink-0 p-1 text-muted-foreground/70 hover:text-destructive"
                      title="Eliminar banda"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Estilo Visual (Etapa I5) */}
      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estilo Visual
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Radio de Esquinas (px)</Label>
            <Input
              type="number"
              min={0}
              value={localBlock.estilo?.esquinas ?? ''}
              placeholder="Auto"
              onChange={(e) => handleEstiloEsquinasChange(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Fuente Tipográfica</Label>
            <Input
              type="text"
              value={localBlock.estilo?.fuente ?? ''}
              placeholder="Heredada"
              onChange={(e) => handleEstiloFuenteChange(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Fondo</Label>
          <Select
            value={localBlock.estilo?.fondo || 'transparente'}
            onValueChange={(val) => handleEstiloFondoChange(val as 'transparente' | 'tarjeta')}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Transparente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparente" className="text-xs">Transparente</SelectItem>
              <SelectItem value="tarjeta" className="text-xs">Color de tarjeta (tema)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Label className="text-[11px] text-muted-foreground">Sombra Sutil</Label>
          <Switch
            checked={Boolean(localBlock.estilo?.sombra)}
            onCheckedChange={handleEstiloSombraToggle}
          />
        </div>

        {Boolean(localBlock.animar) && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Duración de Animación (ms)</Label>
            <Input
              type="number"
              min={0}
              value={localBlock.estilo?.duracionAnimacion ?? ''}
              placeholder="Auto"
              onChange={(e) => handleEstiloDuracionChange(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground">Paleta Personalizada</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPaletaColor}
              className="h-6 px-1.5 text-[10px]"
            >
              <Plus className="mr-1 h-3 w-3" /> Añadir Color
            </Button>
          </div>
          {localBlock.paletaPersonalizada && localBlock.paletaPersonalizada.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {localBlock.paletaPersonalizada.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1 rounded border border-border/60 bg-muted/30 p-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handlePaletaColorChange(idx, e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border border-input bg-transparent p-0"
                    title="Color de la paleta"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePaletaColor(idx)}
                    className="p-0.5 text-muted-foreground/70 hover:text-destructive"
                    title="Eliminar color"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {(!localBlock.paletaPersonalizada || localBlock.paletaPersonalizada.length === 0) && (
            <span className="text-[10px] text-muted-foreground/70">Sin paleta personalizada — usa la paleta seleccionada arriba.</span>
          )}
        </div>
      </div>
    </div>
  );
}


