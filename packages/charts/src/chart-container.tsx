'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@lumina/ui/skeleton';
import { Button } from '@lumina/ui/button';
import { cn } from '@lumina/ui/lib/utils';
import type { ApexOptions } from 'apexcharts';
import { buildApexChart } from './apex/build-apex-options.js';
import { resolveChartTheme, type LuminaChartTheme } from './chart-theme.js';
import type { LuminaChartConfig } from './types.js';

// Único punto del paquete que importa `react-apexcharts` — ver el comentario
// de package.json y la decisión de motor en AGENTS.md (Etapa H). `ssr:false`
// porque ApexCharts necesita `window` (SVG.js) al montar, mismo patrón que
// usaba `grafico-chart-renderer.tsx` con Recharts.
const ApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-lg" />,
});

export interface LuminaChartProps {
  config: LuminaChartConfig;
  className?: string;
}

function useLiveChartTheme(): LuminaChartTheme {
  const [theme, setTheme] = useState<LuminaChartTheme>(() => resolveChartTheme());

  useEffect(() => {
    setTheme(resolveChartTheme());

    // Reacciona a un cambio de tema (next-themes alterna la clase `.dark` en
    // <html>) sin que el consumidor tenga que re-montar el gráfico a mano.
    const observer = new MutationObserver(() => setTheme(resolveChartTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function ChartDataTable({ config }: { config: LuminaChartConfig }) {
  const isScatterOrBubble = config.type === 'scatter' || config.type === 'bubble';
  const isBubble = config.type === 'bubble';

  if (isScatterOrBubble) {
    return (
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{config.titulo || 'Datos del gráfico'}</caption>
        <thead>
          <tr className="border-b border-border">
            <th className="p-1.5 font-medium text-muted-foreground">Serie</th>
            <th className="p-1.5 font-medium text-muted-foreground">X</th>
            <th className="p-1.5 font-medium text-muted-foreground">Y</th>
            {isBubble && <th className="p-1.5 font-medium text-muted-foreground">Tamaño (Z)</th>}
          </tr>
        </thead>
        <tbody>
          {config.series.flatMap((s) =>
            (s.puntos ?? []).map((pt, pIdx) => (
              <tr key={`${s.nombre}-${pIdx}`} className="border-b border-border/40">
                <td className="p-1.5 text-foreground">{s.nombre}</td>
                <td className="p-1.5 text-foreground tabular-nums">{pt.x}</td>
                <td className="p-1.5 text-foreground tabular-nums">{pt.y}</td>
                {isBubble && <td className="p-1.5 text-foreground tabular-nums">{pt.z ?? 0}</td>}
              </tr>
            )),
          )}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full text-left text-xs">
      <caption className="sr-only">{config.titulo || 'Datos del gráfico'}</caption>
      <thead>
        <tr className="border-b border-border">
          <th className="p-1.5 font-medium text-muted-foreground">Categoría</th>
          {config.series.map((s) => (
            <th key={s.nombre} className="p-1.5 font-medium text-muted-foreground">
              {s.nombre}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {config.categorias.map((cat, catIdx) => (
          <tr key={cat} className="border-b border-border/40">
            <td className="p-1.5 text-foreground">{cat}</td>
            {config.series.map((s) => (
              <td key={s.nombre} className="p-1.5 text-foreground tabular-nums">
                {s.valores[catIdx] ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Único componente público de render de `@lumina/charts`. Encapsula la carga
 * perezosa, el theming claro/oscuro y la tabla de datos accesible — el
 * consumidor (`grafico`, `/analytics`) solo entrega un `LuminaChartConfig`.
 */
export function LuminaChart({ config, className }: LuminaChartProps) {
  const theme = useLiveChartTheme();
  const [showTable, setShowTable] = useState(false);

  const built = useMemo(() => buildApexChart(config, theme), [config, theme]);

  const hasData =
    config.type === 'scatter' || config.type === 'bubble'
      ? config.series.length > 0 && config.series.some((s) => (s.puntos?.length ?? 0) > 0)
      : config.categorias.length > 0 && config.series.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Sin datos disponibles
      </div>
    );
  }

  return (
    <div className={cn('relative flex h-full w-full flex-col', className)}>
      {config.descripcionAccesible && (
        <div className="sr-only" aria-live="polite">
          {config.descripcionAccesible}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {showTable ? (
          <div className="h-full w-full overflow-auto">
            <ChartDataTable config={config} />
          </div>
        ) : (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
            {/*
              `key={config.type}` fuerza un remount de <Chart> al cambiar de
              tipo. Sin esto, react-apexcharts intenta reconfigurar la misma
              instancia vía `updateOptions()` — funciona entre tipos afines
              (column↔bar) pero deja geometría obsoleta al saltar entre
              formas de eje muy distintas (scatter numérico → combo
              categórico, combo → heatmap): confirmado en vivo (H6) que la
              única forma de recuperar el render correcto sin este `key` era
              recargar la página — los datos persistidos siempre eran
              correctos, solo el DOM del chart montado quedaba stale.
            */}
            <ApexChart
              key={config.type}
              type={built.chartType}
              series={built.series as ApexOptions['series']}
              options={built.options}
              width="100%"
              height="100%"
            />
          </Suspense>
        )}
      </div>

      {!config.isThumbnail && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 h-6 self-end text-[10px] text-muted-foreground"
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? 'Ver gráfico' : 'Ver tabla de datos'}
        </Button>
      )}
    </div>
  );
}
