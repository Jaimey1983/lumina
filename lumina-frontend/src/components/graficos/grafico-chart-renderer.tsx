'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { GraficoDatosBlock } from '@/types/slide.types';
import { getSeriesColor } from './grafico-color-palettes';

interface GraficoChartRendererProps {
  block: GraficoDatosBlock;
  isThumbnail?: boolean;
}

export default function GraficoChartRenderer({
  block,
  isThumbnail = false,
}: GraficoChartRendererProps) {
  const { chartType, categorias, series, colorPaleta, mostrarLeyenda } = block;

  // Formatear datos para gráficos cartesianos (Bar, Column, Line, Area)
  const cartesianData = useMemo(() => {
    return categorias.map((cat, catIdx) => {
      const row: Record<string, string | number> = { categoria: cat };
      series.forEach((s) => {
        row[s.nombre] = s.valores[catIdx] ?? 0;
      });
      return row;
    });
  }, [categorias, series]);

  // Formatear datos para gráficos circulares y radiales (Pie, Donut, RadialBar)
  const circularData = useMemo(() => {
    // Si hay series, usamos la primera serie (o combinamos si se requiere)
    const primarySeries = series[0] || { nombre: 'Datos', valores: [] };
    return categorias.map((cat, catIdx) => {
      const val = primarySeries.valores[catIdx] ?? 0;
      return {
        name: cat,
        value: val,
        fill: getSeriesColor(catIdx, colorPaleta),
      };
    });
  }, [categorias, series, colorPaleta]);

  const tickFontSize = isThumbnail ? 8 : 11;

  if (categorias.length === 0 || series.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Sin datos disponibles
      </div>
    );
  }

  // ─── 1. Gráficos de Barras / Columnas (D-DG-10: Mismo componente BarChart) ───
  if (chartType === 'column' || chartType === 'bar') {
    const isHorizontalBars = chartType === 'bar';

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={cartesianData}
          layout={isHorizontalBars ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 15, left: isHorizontalBars ? 15 : 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          {isHorizontalBars ? (
            <>
              <XAxis type="number" tick={{ fontSize: tickFontSize }} />
              <YAxis
                dataKey="categoria"
                type="category"
                width={80}
                tick={{ fontSize: tickFontSize }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="categoria"
                tick={{ fontSize: tickFontSize }}
                interval={0}
              />
              <YAxis tick={{ fontSize: tickFontSize }} />
            </>
          )}
          {!isThumbnail && <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />}
          {mostrarLeyenda && !isThumbnail && (
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          )}
          {series.map((s, idx) => (
            <Bar
              key={s.nombre || idx}
              dataKey={s.nombre}
              fill={getSeriesColor(idx, colorPaleta, s.color)}
              radius={isHorizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // ─── 2. Gráfico de Líneas ───────────────────────────────────────────────────
  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={cartesianData}
          margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="categoria"
            tick={{ fontSize: tickFontSize }}
            interval={0}
          />
          <YAxis tick={{ fontSize: tickFontSize }} />
          {!isThumbnail && <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />}
          {mostrarLeyenda && !isThumbnail && (
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          )}
          {series.map((s, idx) => (
            <Line
              key={s.nombre || idx}
              type="monotone"
              dataKey={s.nombre}
              stroke={getSeriesColor(idx, colorPaleta, s.color)}
              strokeWidth={2}
              dot={{ r: isThumbnail ? 1.5 : 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // ─── 3. Gráfico de Área ─────────────────────────────────────────────────────
  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={cartesianData}
          margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="categoria"
            tick={{ fontSize: tickFontSize }}
            interval={0}
          />
          <YAxis tick={{ fontSize: tickFontSize }} />
          {!isThumbnail && <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />}
          {mostrarLeyenda && !isThumbnail && (
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          )}
          {series.map((s, idx) => {
            const color = getSeriesColor(idx, colorPaleta, s.color);
            return (
              <Area
                key={s.nombre || idx}
                type="monotone"
                dataKey={s.nombre}
                stroke={color}
                fill={color}
                fillOpacity={0.25}
                strokeWidth={2}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // ─── 4. Gráfico Circular / Torta o Dona (Pie / Donut) ────────────────────────
  if (chartType === 'pie' || chartType === 'donut') {
    const isDonut = chartType === 'donut';

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          {!isThumbnail && <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />}
          {mostrarLeyenda && !isThumbnail && (
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          )}
          <Pie
            data={circularData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={isDonut ? '50%' : 0}
            outerRadius={isDonut ? '78%' : '75%'}
            paddingAngle={isDonut ? 2 : 0}
            label={
              !isThumbnail && !isDonut
                ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`
                : undefined
            }
            labelLine={!isThumbnail && !isDonut}
          >
            {circularData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // ─── 5. Gráfico de Barras Radiales (RadialBar) ──────────────────────────────
  if (chartType === 'radialBar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          data={circularData}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar background dataKey="value" />
          {!isThumbnail && <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />}
          {mostrarLeyenda && !isThumbnail && (
            <Legend
              iconSize={10}
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 11 }}
            />
          )}
        </RadialBarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
