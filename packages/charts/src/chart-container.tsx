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

/**
 * Arco parcial (`angulo: 'semicirculo'` o `'personalizado'` en
 * pie/donut/radialBar): ApexCharts 5.16 trae una lógica de auto-ajuste
 * específica para arcos parciales (mide la geometría real del arco dibujado
 * y redimensiona/centra el SVG a su alrededor, en vez de asumir un círculo
 * entero) — pero esa lógica se salta por completo cuando `chart.height` es
 * un porcentaje (`'100%'`, lo que `<LuminaChart>` siempre pasaba): sin saber
 * cuánto necesita el arco, ApexCharts centra y dimensiona como si fuera un
 * círculo entero, y el arco queda confinado a su mitad de esa caja completa
 * — chico y pegado arriba/abajo según el ángulo. Pasar `height="auto"` para
 * este caso activa la lógica nativa de ApexCharts.
 */
export function isPartialArcChart(config: Pick<LuminaChartConfig, 'type' | 'angulo'>): boolean {
  return (
    (config.type === 'pie' || config.type === 'donut' || config.type === 'radialBar') &&
    (config.angulo === 'semicirculo' || config.angulo === 'personalizado')
  );
}

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
 * Reemplazo de la leyenda nativa de ApexCharts para arcos parciales (ver el
 * comentario sobre por qué se apaga `legend.show` en `buildCircularChart`)
 * — mismo aspecto visual (punto de color + nombre, 11px), pero como HTML
 * plano nuestro, sin la lógica de posicionamiento interna de ApexCharts que
 * falla para arcos parciales.
 */
function PartialArcLegend({ config, colors }: { config: LuminaChartConfig; colors: string[] }) {
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-foreground">
      {config.categorias.map((cat, idx) => (
        <span key={cat} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: colors[idx % colors.length] }}
          />
          {cat}
        </span>
      ))}
    </div>
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

  // Clave de remount: `config` completo (dato plano, sin funciones), no solo
  // `config.type`. `react-apexcharts` reconfigura la instancia existente vía
  // `updateOptions()` cuando solo cambian las `options`, y el merge interno
  // de ApexCharts únicamente sobreescribe claves PRESENTES en el objeto
  // nuevo — una clave que existía (`plotOptions.pie.startAngle`, el
  // `formatter` de `yaxis.labels`/`tooltip.y`…) y que ahora simplemente ya
  // no está (porque `angulo`/`formatoValor` volvieron a su valor por
  // defecto) no se resetea, queda con el valor de la instancia vieja hasta
  // recargar la página. Antes esto solo se resolvía para `config.type`
  // (Etapa H6, cambios de tipo entre formas de eje muy distintas); se
  // generaliza a cualquier cambio de `config` para no tener que perseguir
  // cada campo opcional nuevo uno por uno.
  const chartKey = useMemo(() => JSON.stringify(config), [config]);

  const isPartialArc = isPartialArcChart(config);

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

      <div
        className={cn(
          'relative min-h-0 flex-1',
          // `flex-col` + `justify-center` centra verticalmente el arco
          // parcial en el alto que sobra sin tocar el eje principal (ancho):
          // `justify-content` en un flex ROW centra por ANCHO (colapsa el
          // div de `react-apexcharts`, que no trae su propio CSS de tamaño,
          // a su contenido — 0px — antes de que ApexCharts lo mida, dándole
          // un ancho de referencia minúsculo). En columna, `justify-content`
          // centra por ALTO y el ancho sigue el `align-items` por defecto
          // (`stretch`), así el hijo mide el 100% del ancho real disponible.
          isPartialArc && 'flex flex-col justify-center',
        )}
      >
        {showTable ? (
          <div className="h-full w-full overflow-auto">
            <ChartDataTable config={config} />
          </div>
        ) : (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
            <ApexChart
              key={chartKey}
              type={built.chartType}
              series={built.series as ApexOptions['series']}
              options={built.options}
              width="100%"
              height={isPartialArc ? 'auto' : '100%'}
            />
          </Suspense>
        )}
      </div>

      {/*
       * Fuera del contenedor que centra el gráfico (arriba) — a propósito.
       * El recorte de ApexCharts para arcos parciales (`resizeNonAxisCharts`)
       * está probado para el semicírculo simétrico (-90/90), pero para un
       * ángulo personalizado/asimétrico el alto final que le queda a esa
       * caja no es predecible; si la leyenda viviera ADENTRO de esa misma
       * caja centrada, podía terminar sin espacio propio y quedar recortada
       * por el `overflow-hidden` de la tarjeta (bug real, reportado en
       * producción). Como hermano al mismo nivel que el botón "Ver tabla de
       * datos", siempre tiene su propia fila en el flujo normal, sin
       * depender de cuánto midió el arco.
       */}
      {isPartialArc &&
        !showTable &&
        Boolean(config.mostrarLeyenda) &&
        !config.isThumbnail &&
        !config.modoSparkline && <PartialArcLegend config={config} colors={(built.options.colors as string[]) ?? []} />}

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
