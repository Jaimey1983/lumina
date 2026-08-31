'use client';

import { useMemo, type Ref } from 'react';

import type { DiagramaVennBlock, DiagramaVennElemento } from '@/types/slide.types';
import { cn } from '@/lib/utils';

import { regionCentroid, vennCircles } from './diagrama-regions';

interface VennSvgProps {
  block: DiagramaVennBlock;
  draggingId?: string | null;
  dragClient?: { x: number; y: number } | null;
  isSelected?: boolean;
  onChipPointerDown?: (elementoId: string, event: React.PointerEvent) => void;
  svgRef?: Ref<SVGSVGElement>;
  trayRef?: Ref<HTMLDivElement>;
}

export function VennSvg({
  block,
  draggingId,
  isSelected = false,
  onChipPointerDown,
  svgRef,
  trayRef,
}: VennSvgProps) {
  const circles = vennCircles(block.conjuntos);
  const byRegion = useMemo(() => {
    const map = new Map<string | null, DiagramaVennElemento[]>();
    for (const el of block.elementos) {
      const key = el.regionId;
      const list = map.get(key) ?? [];
      list.push(el);
      map.set(key, list);
    }
    return map;
  }, [block.elementos]);

  const tray = byRegion.get(null) ?? [];

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="relative min-h-0 flex-1">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="h-full w-full"
          role="img"
          aria-hidden
        >
          {circles.map((c) => (
            <circle
              key={c.id}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              fill={c.fill}
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeWidth={0.6}
            />
          ))}
          {circles.map((c) => (
            <text
              key={`label-${c.id}`}
              x={c.id === 'A' ? c.cx - 16 : c.id === 'B' ? c.cx + 16 : c.cx}
              y={c.id === 'C' ? c.cy + 18 : c.cy - 16}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={4.2}
              fontWeight={600}
            >
              {c.id}
            </text>
          ))}
        </svg>

        {block.regiones.map((region) => {
          const items = (byRegion.get(region.id) ?? []).filter((el) => el.id !== draggingId);
          const centroid = regionCentroid(region.id, block.conjuntos);
          if (items.length === 0) return null;
          return (
            <div
              key={region.id}
              className="pointer-events-none absolute flex max-w-[36%] flex-col items-center gap-0.5"
              style={{
                left: `${centroid.x}%`,
                top: `${centroid.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {items.map((el) => (
                <Chip
                  key={el.id}
                  texto={el.texto}
                  interactive={isSelected}
                  onPointerDown={(e) => onChipPointerDown?.(el.id, e)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div
        ref={trayRef}
        className={cn(
          'mt-1 flex min-h-8 flex-wrap items-center gap-1 rounded-md border border-dashed border-border/70 bg-muted/30 px-1.5 py-1',
          !isSelected && 'pointer-events-none',
        )}
        aria-label="Elementos fuera de los conjuntos"
      >
        {tray.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">
            {isSelected ? 'Arrastra elementos a una región o suéltalos aquí' : 'Sin elementos fuera'}
          </span>
        ) : (
          tray
            .filter((el) => el.id !== draggingId)
            .map((el) => (
              <Chip
                key={el.id}
                texto={el.texto}
                interactive={isSelected}
                onPointerDown={(e) => onChipPointerDown?.(el.id, e)}
              />
            ))
        )}
      </div>
    </div>
  );
}

function Chip({
  texto,
  interactive,
  onPointerDown,
}: {
  texto: string;
  interactive: boolean;
  onPointerDown?: (event: React.PointerEvent) => void;
}) {
  return (
    <span
      className={cn(
        'pointer-events-auto max-w-full truncate rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-xs',
        interactive && 'cursor-grab active:cursor-grabbing',
      )}
      onPointerDown={interactive ? onPointerDown : undefined}
    >
      {texto}
    </span>
  );
}
