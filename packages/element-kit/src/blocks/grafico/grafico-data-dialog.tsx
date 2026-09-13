'use client';

import React from 'react';
import { Plus, Trash2, Table as TableIcon, AlertCircle } from 'lucide-react';
import type { GraficoDatosBlock, GraficoSerie } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from '@lumina/ui/dialog';

interface GraficoDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: GraficoDatosBlock;
  commitChange: (updated: GraficoDatosBlock, immediate?: boolean) => void;
}

export function GraficoDataDialog({
  open,
  onOpenChange,
  block,
  commitChange,
}: GraficoDataDialogProps) {
  const isScatterOrBubble = block.chartType === 'scatter' || block.chartType === 'bubble';
  const isBubble = block.chartType === 'bubble';
  const isCombo = block.chartType === 'combo';

  // Manipulación de Categorias (Filas)
  const handleCategoryNameChange = (catIdx: number, newName: string) => {
    const nextCategorias = [...block.categorias];
    nextCategorias[catIdx] = newName;
    commitChange({ ...block, categorias: nextCategorias });
  };

  const handleAddCategory = () => {
    const nextCategorias = [...block.categorias, `Categoria ${block.categorias.length + 1}`];
    const nextSeries = block.series.map((s) => ({
      ...s,
      valores: [...s.valores, 0],
    }));
    commitChange({ ...block, categorias: nextCategorias, series: nextSeries }, true);
  };

  const handleRemoveCategory = (catIdx: number) => {
    if (block.categorias.length <= 1) return;
    const nextCategorias = block.categorias.filter((_, idx) => idx !== catIdx);
    const nextSeries = block.series.map((s) => ({
      ...s,
      valores: s.valores.filter((_, idx) => idx !== catIdx),
    }));
    commitChange({ ...block, categorias: nextCategorias, series: nextSeries }, true);
  };

  // Manipulación de Series (Columnas)
  const handleSeriesNameChange = (serieIdx: number, newName: string) => {
    const nextSeries = [...block.series];
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], nombre: newName };
    commitChange({ ...block, series: nextSeries });
  };

  const handleSeriesValueChange = (serieIdx: number, catIdx: number, rawVal: string) => {
    const val = Number(rawVal);
    const num = Number.isFinite(val) ? val : 0;
    const nextSeries = [...block.series];
    const nextVals = [...nextSeries[serieIdx].valores];
    nextVals[catIdx] = num;
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], valores: nextVals };
    commitChange({ ...block, series: nextSeries });
  };

  const handleSeriesTipoComboChange = (serieIdx: number, tipoCombo: 'column' | 'line' | 'area') => {
    const nextSeries = [...block.series];
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], tipoCombo };
    commitChange({ ...block, series: nextSeries }, true);
  };

  const handleSeriesEjeComboChange = (serieIdx: number, ejeCombo: 'primario' | 'secundario') => {
    const nextSeries = [...block.series];
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], ejeCombo };
    commitChange({ ...block, series: nextSeries }, true);
  };

  const handleAddSeries = () => {
    const nextSeries: GraficoSerie[] = [
      ...block.series,
      {
        nombre: `Serie ${block.series.length + 1}`,
        valores: Array.from({ length: block.categorias.length }, () => 0),
        ...(isScatterOrBubble
          ? {
              puntos: [
                { x: 10, y: 20, ...(isBubble ? { z: 15 } : {}) },
                { x: 20, y: 40, ...(isBubble ? { z: 25 } : {}) },
              ],
            }
          : {}),
      },
    ];
    commitChange({ ...block, series: nextSeries }, true);
  };

  const handleRemoveSeries = (serieIdx: number) => {
    if (block.series.length <= 1) return;
    const nextSeries = block.series.filter((_, idx) => idx !== serieIdx);
    commitChange({ ...block, series: nextSeries }, true);
  };

  // Manipulación de Puntos (Scatter / Bubble)
  const handlePointChange = (serieIdx: number, ptIdx: number, field: 'x' | 'y' | 'z', rawVal: string) => {
    const val = Number(rawVal);
    const num = Number.isFinite(val) ? val : 0;
    const nextSeries = [...block.series];
    const puntos = [...(nextSeries[serieIdx].puntos || [])];
    puntos[ptIdx] = { ...puntos[ptIdx], [field]: num };
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], puntos };
    commitChange({ ...block, series: nextSeries });
  };

  const handleAddPoint = (serieIdx: number) => {
    const nextSeries = [...block.series];
    const puntos = [...(nextSeries[serieIdx].puntos || [])];
    const lastPt = puntos[puntos.length - 1];
    puntos.push({
      x: (lastPt?.x ?? 0) + 10,
      y: (lastPt?.y ?? 0) + 15,
      ...(isBubble ? { z: 20 } : {}),
    });
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], puntos };
    commitChange({ ...block, series: nextSeries }, true);
  };

  const handleRemovePoint = (serieIdx: number, ptIdx: number) => {
    const nextSeries = [...block.series];
    const puntos = (nextSeries[serieIdx].puntos || []).filter((_, idx) => idx !== ptIdx);
    nextSeries[serieIdx] = { ...nextSeries[serieIdx], puntos };
    commitChange({ ...block, series: nextSeries }, true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="mb-3">
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            <DialogTitle className="text-base font-semibold">Editor de Datos del Gráfico</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isScatterOrBubble
              ? 'Edita las coordenadas (X, Y' + (isBubble ? ', Tamaño Z' : '') + ') de cada serie.'
              : 'Edita los nombres de categorías (filas), series (columnas) y sus valores numéricos.'}
          </DialogDescription>
        </DialogHeader>


        <DialogBody className="grow overflow-y-auto pr-1 space-y-4">
          {['treemap', 'funnel'].includes(block.chartType) && block.series.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Nota: este tipo de gráfico utiliza únicamente los valores de la primera serie para calcular las áreas.</span>
            </div>
          )}


          {isScatterOrBubble ? (
            <div className="space-y-4">
              {block.series.map((serie, sIdx) => (
                <div key={sIdx} className="rounded-lg border border-border bg-card p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Serie {sIdx + 1}:</span>
                      <input
                        type="text"
                        value={serie.nombre}
                        onChange={(e) => handleSeriesNameChange(sIdx, e.target.value)}
                        className="font-medium text-foreground bg-transparent text-sm border-b border-dashed border-border hover:border-primary focus:border-primary focus:outline-hidden px-1"
                        placeholder="Nombre de serie..."
                      />
                    </div>
                    {block.series.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSeries(sIdx)}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar Serie
                      </Button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-md border border-border/70">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold text-muted-foreground">
                          <th className="p-2 w-12 text-center">#</th>
                          <th className="p-2">Coordenada X</th>
                          <th className="p-2">Coordenada Y</th>
                          {isBubble && <th className="p-2">Tamaño (Z)</th>}
                          <th className="w-10 p-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(serie.puntos || []).map((pt, ptIdx) => (
                          <tr key={ptIdx} className="border-b border-border/40 hover:bg-muted/30">
                            <td className="p-2 text-center text-muted-foreground font-mono text-[11px]">
                              {ptIdx + 1}
                            </td>
                            <td className="p-1.5">
                              <input
                                type="number"
                                value={pt.x}
                                onChange={(e) => handlePointChange(sIdx, ptIdx, 'x', e.target.value)}
                                className="h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary font-mono text-right"
                               />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="number"
                                value={pt.y}
                                onChange={(e) => handlePointChange(sIdx, ptIdx, 'y', e.target.value)}
                                className="h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary font-mono text-right"
                               />
                            </td>
                            {isBubble && (
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  value={pt.z ?? 10}
                                  onChange={(e) => handlePointChange(sIdx, ptIdx, 'z', e.target.value)}
                                  className="h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary font-mono text-right"
                                 />
                              </td>
                            )}
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePoint(sIdx, ptIdx)}
                                className="text-muted-foreground/70 hover:text-destructive p-1 rounded-sm transition-colors"
                                title="Eliminar punto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPoint(sIdx)}
                    className="w-full h-7 text-xs border-dashed"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Añadir Punto (X, Y{isBubble ? ', Z' : ''})
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSeries}
                className="w-full h-8 text-xs font-medium"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Añadir Nueva Serie
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Filas = Categorías (Eje X) · Columnas = Series de Datos
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSeries}
                  className="h-7 px-2.5 text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Serie
                </Button>
              </div>


              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-[11px] text-muted-foreground">
                      <th className="p-2.5 min-w-[140px] font-semibold">Categoría</th>
                      {block.series.map((serie, sIdx) => (
                        <th key={sIdx} className="p-2.5 min-w-[120px] font-semibold border-l border-border/40">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <input
                                type="text"
                                value={serie.nombre}
                                onChange={(e) => handleSeriesNameChange(sIdx, e.target.value)}
                                className="w-full bg-transparent font-medium text-foreground border-b border-dashed border-border/60 hover:border-primary focus:border-primary focus:outline-hidden px-0.5 text-xs truncate"
                                title="Editar nombre de la serie"
                              />
                              {block.series.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSeries(sIdx)}
                                  className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                                  title="Eliminar serie"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {isCombo && (
                              <div className="flex gap-1">
                                <select
                                  value={serie.tipoCombo || 'column'}
                                  onChange={(e) => handleSeriesTipoComboChange(sIdx, e.target.value as 'column' | 'line' | 'area')}
                                  className="text-[10px] bg-muted/80 rounded px-1.5 py-0.5 border border"
                                >
                                  <option value="column">Barras</option>
                                  <option value="line">Línea</option>
                                  <option value="area">Área</option>
                                </select>
                                <select
                                  value={serie.ejeCombo || 'primario'}
                                  onChange={(e) => handleSeriesEjeComboChange(sIdx, e.target.value as 'primario' | 'secundario')}
                                  className="text-[10px] bg-muted/80 rounded px-1.5 py-0.5 border border"
                                >
                                  <option value="primario">Eje 1</option>
                                  <option value="secundario">Eje 2</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-10 p-2 text-center border-l border-border/40"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.categorias.map((cat, cIdx) => (
                      <tr key={cIdx} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={cat}
                            onChange={(e) => handleCategoryNameChange(cIdx, e.target.value)}
                            className="h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        {block.series.map((serie, sIdx) => (
                          <td key={sIdx} className="p-1.5 border-l border-border/40">
                            <input
                              type="number"
                              value={serie.valores[cIdx] ?? 0}
                              onChange={(e) => handleSeriesValueChange(sIdx, cIdx, e.target.value)}
                              className="h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary text-right font-mono"
                            />
                          </td>
                        ))}
                        <td className="p-1.5 text-center border-l border-border/40">
                          {block.categorias.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cIdx)}
                              className="text-muted-foreground/70 hover:text-destructive transition-colors p-1 rounded-sm"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
                variant="outline"
                size="sm"
                onClick={handleAddCategory}
                className="w-full h-8 text-xs border-dashed"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Añadir Categoría (Fila)
              </Button>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="mt-4 pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {isScatterOrBubble
              ? `${block.series.length} ${block.series.length === 1 ? 'serie' : 'series'}`
              : `${block.categorias.length} ${block.categorias.length === 1 ? 'categoría' : 'categorías'} · ${block.series.length} ${block.series.length === 1 ? 'serie' : 'series'}`}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="px-4 text-xs"
          >
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
