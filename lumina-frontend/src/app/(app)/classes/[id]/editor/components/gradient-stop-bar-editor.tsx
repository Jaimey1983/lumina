'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Trash2 } from 'lucide-react';

import type { GradientColorStop } from '@/types/slide.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  buildLinearGradientCss,
  clampMidpoint,
  clampStopDragPosition,
  DEFAULT_GRADIENT_MIDPOINT,
  interpolateGradientColorAtPosition,
  midpointFromHandlePosition,
  midpointHandlePosition,
  positionFromPointer,
  sortGradientStops,
} from '@/lib/slide-background';

const MARKER_HALF = 7;
const MIN_STOP_COUNT = 2;
const MIN_MARKER_GAP = 2;
const DEFAULT_MAX_STOPS = 8;

type IndexedStop = { stop: GradientColorStop; index: number };

type ColorDragState = { kind: 'color'; index: number; pointerId: number };
type MidDragState = { kind: 'mid'; leftIndex: number; pointerId: number };

export interface GradientStopBarEditorProps {
  stops: GradientColorStop[];
  disabled?: boolean;
  maxStops?: number;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  onChange: (stops: GradientColorStop[]) => void;
}

function indexedStops(stops: GradientColorStop[]): IndexedStop[] {
  return stops
    .map((stop, index) => ({ stop, index }))
    .sort((a, b) => a.stop.position - b.stop.position);
}

function GradientMarker({
  stop,
  selected,
  disabled,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  stop: GradientColorStop;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'absolute top-[26px] z-10 -translate-x-1/2 touch-none p-1.5',
        'flex flex-col items-center outline-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing',
        selected && 'z-20',
      )}
      style={{ left: `${stop.position}%` }}
      aria-label={`Color ${Math.round(stop.position)}%`}
      aria-pressed={selected}
    >
      <span
        className={cn(
          'block h-2 w-0.5 rounded-full bg-foreground/25',
          selected && 'bg-primary/60',
        )}
        aria-hidden
      />
      <span
        className={cn(
          'mt-0.5 block size-3.5 rotate-45 rounded-[2px] border-2 shadow-md transition-[transform,box-shadow]',
          'border-background',
          selected
            ? 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background'
            : 'hover:scale-105',
        )}
        style={{ backgroundColor: stop.color }}
        aria-hidden
      />
    </button>
  );
}

function MidpointHandle({
  positionPct,
  selected,
  disabled,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  positionPct: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'absolute top-[9px] z-[15] -translate-x-1/2 touch-none p-2',
        'flex items-center justify-center outline-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-ew-resize',
        selected && 'z-[25]',
      )}
      style={{ left: `${positionPct}%` }}
      aria-label="Manejador de difuminado"
      aria-pressed={selected}
    >
      <span
        className={cn(
          'block size-2.5 rounded-full border-2 border-background shadow-md transition-transform',
          'bg-foreground/75',
          selected
            ? 'scale-125 bg-primary ring-2 ring-primary/40'
            : 'hover:scale-110 hover:bg-foreground',
        )}
        aria-hidden
      />
    </button>
  );
}

export function GradientStopBarEditor({
  stops,
  disabled,
  maxStops = DEFAULT_MAX_STOPS,
  selectedIndex,
  onSelectedIndexChange,
  onChange,
}: GradientStopBarEditorProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ColorDragState | MidDragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMidLeftIndex, setSelectedMidLeftIndex] = useState<number | null>(null);

  const sortedIndexed = useMemo(() => indexedStops(stops), [stops]);

  const segments = useMemo(
    () =>
      sortedIndexed.slice(0, -1).map((left, segIdx) => {
        const right = sortedIndexed[segIdx + 1];
        return {
          leftIndex: left.index,
          rightIndex: right.index,
          left: left.stop,
          right: right.stop,
          handlePct: midpointHandlePosition(left.stop, right.stop),
          mid: left.stop.puntoMedio ?? DEFAULT_GRADIENT_MIDPOINT,
        };
      }),
    [sortedIndexed],
  );

  const barBackground = useMemo(() => buildLinearGradientCss(stops, 90), [stops]);

  const selectedStop = selectedIndex >= 0 ? stops[selectedIndex] : undefined;
  const selectedSegment =
    selectedMidLeftIndex !== null
      ? segments.find((s) => s.leftIndex === selectedMidLeftIndex)
      : undefined;

  const updateStopAtIndex = useCallback(
    (index: number, patch: Partial<GradientColorStop>, options?: { sort?: boolean }) => {
      const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
      onChange(options?.sort === false ? next : sortGradientStops(next));
    },
    [onChange, stops],
  );

  const removeSelectedStop = useCallback(() => {
    if (stops.length <= MIN_STOP_COUNT || selectedIndex < 0) return;
    const next = stops.filter((_, i) => i !== selectedIndex);
    onChange(sortGradientStops(next));
    onSelectedIndexChange(Math.min(selectedIndex, next.length - 1));
    setSelectedMidLeftIndex(null);
  }, [onChange, onSelectedIndexChange, selectedIndex, stops]);

  const addStopAtPosition = useCallback(
    (position: number) => {
      if (disabled || stops.length >= maxStops) return;
      const tooClose = stops.some((s) => Math.abs(s.position - position) < MIN_MARKER_GAP);
      if (tooClose) return;

      const color = interpolateGradientColorAtPosition(stops, position);
      let next = sortGradientStops([
        ...stops.map((s) => ({ ...s })),
        { color, position, puntoMedio: DEFAULT_GRADIENT_MIDPOINT },
      ]);

      const sorted = indexedStops(next);
      const insertIdx = sorted.findIndex(
        (x) => Math.abs(x.stop.position - position) < 0.05 && x.stop.color === color,
      );

      if (insertIdx > 0) {
        const prevIdx = sorted[insertIdx - 1].index;
        next = next.map((s, i) => (i === prevIdx ? { ...s, puntoMedio: 62 } : s));
      }
      if (insertIdx >= 0 && insertIdx < sorted.length - 1) {
        const newIdx = sorted[insertIdx].index;
        next = next.map((s, i) => (i === newIdx ? { ...s, puntoMedio: 38 } : s));
      }

      onChange(sortGradientStops(next));
      onSelectedIndexChange(insertIdx >= 0 ? sorted[insertIdx].index : next.length - 1);
      setSelectedMidLeftIndex(null);
    },
    [disabled, maxStops, onChange, onSelectedIndexChange, stops],
  );

  const handleBarPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || !barRef.current || e.button !== 0) return;
      const rect = barRef.current.getBoundingClientRect();
      addStopAtPosition(positionFromPointer(e.clientX, rect));
    },
    [addStopAtPosition, disabled],
  );

  const handleColorPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, index: number) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { kind: 'color', index, pointerId: e.pointerId };
      setIsDragging(true);
      onSelectedIndexChange(index);
      setSelectedMidLeftIndex(null);
    },
    [disabled, onSelectedIndexChange],
  );

  const handleMidPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, leftIndex: number) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { kind: 'mid', leftIndex, pointerId: e.pointerId };
      setIsDragging(true);
      setSelectedMidLeftIndex(leftIndex);
      onSelectedIndexChange(-1);
    },
    [disabled, onSelectedIndexChange],
  );

  const handleColorPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, index: number) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== 'color' || drag.index !== index || drag.pointerId !== e.pointerId) {
        return;
      }
      if (!barRef.current) return;

      const rect = barRef.current.getBoundingClientRect();
      const raw = positionFromPointer(e.clientX, rect);
      updateStopAtIndex(index, { position: clampStopDragPosition(stops, index, raw) }, { sort: false });
    },
    [stops, updateStopAtIndex],
  );

  const handleMidPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, leftIndex: number) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== 'mid' || drag.leftIndex !== leftIndex || drag.pointerId !== e.pointerId) {
        return;
      }
      const seg = segments.find((s) => s.leftIndex === leftIndex);
      if (!seg || !barRef.current) return;

      const rect = barRef.current.getBoundingClientRect();
      const handlePos = positionFromPointer(e.clientX, rect);
      const mid = midpointFromHandlePosition(seg.left.position, seg.right.position, handlePos);
      updateStopAtIndex(leftIndex, { puntoMedio: mid }, { sort: false });
    },
    [segments, updateStopAtIndex],
  );

  const handleColorPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, index: number) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== 'color' || drag.index !== index || drag.pointerId !== e.pointerId) {
        return;
      }

      const moving = stops[index];
      dragRef.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const sorted = sortGradientStops(
        stops.map((s) => ({ ...s, position: Math.round(s.position) })),
      );
      onChange(sorted);

      if (moving) {
        const roundedPos = Math.round(moving.position);
        const newIndex = sorted.findIndex(
          (s) => s.color === moving.color && Math.abs(s.position - roundedPos) <= 1,
        );
        if (newIndex >= 0) onSelectedIndexChange(newIndex);
      }
    },
    [onChange, onSelectedIndexChange, stops],
  );

  const handleMidPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, leftIndex: number) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== 'mid' || drag.leftIndex !== leftIndex || drag.pointerId !== e.pointerId) {
        return;
      }
      dragRef.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      if (selectedMidLeftIndex !== null && selectedSegment) {
        const step = e.shiftKey ? 5 : 2;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateStopAtIndex(selectedMidLeftIndex, {
            puntoMedio: clampMidpoint(selectedSegment.mid - step),
          });
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateStopAtIndex(selectedMidLeftIndex, {
            puntoMedio: clampMidpoint(selectedSegment.mid + step),
          });
        }
        return;
      }

      if (selectedIndex < 0 || !selectedStop) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSelectedStop();
        return;
      }
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateStopAtIndex(selectedIndex, {
          position: clampStopDragPosition(stops, selectedIndex, selectedStop.position - step),
        });
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateStopAtIndex(selectedIndex, {
          position: clampStopDragPosition(stops, selectedIndex, selectedStop.position + step),
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    disabled,
    removeSelectedStop,
    selectedIndex,
    selectedMidLeftIndex,
    selectedSegment,
    selectedStop,
    stops,
    updateStopAtIndex,
  ]);

  const leftSegmentForSelected =
    selectedIndex >= 0
      ? segments.find((s) => s.rightIndex === selectedIndex)
      : undefined;
  const rightSegmentForSelected =
    selectedIndex >= 0
      ? segments.find((s) => s.leftIndex === selectedIndex)
      : undefined;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Barra de gradiente</Label>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {stops.length}/{maxStops}
          </span>
        </div>

        <div
          className="relative select-none pb-8 pt-0.5"
          style={{ paddingLeft: MARKER_HALF, paddingRight: MARKER_HALF }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0.5 h-7 rounded-md opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0), linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 4px 4px',
            }}
            aria-hidden
          />
          <div
            ref={barRef}
            role="presentation"
            onPointerDown={handleBarPointerDown}
            className={cn(
              'relative h-7 w-full overflow-visible rounded-md border border-border shadow-inner',
              !disabled && 'cursor-crosshair',
              isDragging && 'ring-1 ring-primary/30',
            )}
            style={{
              background: barBackground,
              boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.06)',
            }}
          />

          {segments.map((seg) => (
            <MidpointHandle
              key={`mid-${seg.leftIndex}-${seg.rightIndex}`}
              positionPct={seg.handlePct}
              selected={selectedMidLeftIndex === seg.leftIndex}
              disabled={disabled}
              onSelect={() => {
                setSelectedMidLeftIndex(seg.leftIndex);
                onSelectedIndexChange(-1);
              }}
              onPointerDown={(e) => handleMidPointerDown(e, seg.leftIndex)}
              onPointerMove={(e) => handleMidPointerMove(e, seg.leftIndex)}
              onPointerUp={(e) => handleMidPointerUp(e, seg.leftIndex)}
            />
          ))}

          {stops.map((stop, index) => (
            <GradientMarker
              key={`${index}-${stop.color}-${Math.round(stop.position)}`}
              stop={stop}
              selected={index === selectedIndex}
              disabled={disabled}
              onSelect={() => {
                onSelectedIndexChange(index);
                setSelectedMidLeftIndex(null);
              }}
              onPointerDown={(e) => handleColorPointerDown(e, index)}
              onPointerMove={(e) => handleColorPointerMove(e, index)}
              onPointerUp={(e) => handleColorPointerUp(e, index)}
            />
          ))}
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          ◆ colores abajo · ● difuminado sobre la barra · arrastra para suavizar transiciones
        </p>
      </div>

      {selectedSegment ? (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-foreground">Difuminado entre colores</Label>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {selectedSegment.mid}%
            </span>
          </div>
          <Slider
            value={[selectedSegment.mid]}
            min={13}
            max={87}
            step={1}
            disabled={disabled}
            onValueChange={([v]) => {
              if (v === undefined) return;
              updateStopAtIndex(selectedMidLeftIndex!, { puntoMedio: clampMidpoint(v) });
            }}
          >
            <SliderThumb />
          </Slider>
          <p className="text-[10px] text-muted-foreground">
            Mueve hacia un color para alargar su zona; hacia el centro para mezcla más suave.
          </p>
        </div>
      ) : null}

      {selectedStop && selectedIndex >= 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2">
            <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border shadow-xs">
              <span
                className="absolute inset-0"
                style={{ backgroundColor: selectedStop.color }}
                aria-hidden
              />
              <input
                type="color"
                value={selectedStop.color}
                disabled={disabled}
                onChange={(e) => updateStopAtIndex(selectedIndex, { color: e.target.value })}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                aria-label="Color del marcador seleccionado"
              />
            </label>
            <Input
              value={selectedStop.color}
              disabled={disabled}
              onChange={(e) => updateStopAtIndex(selectedIndex, { color: e.target.value })}
              className="h-9 flex-1 font-mono text-xs uppercase"
              spellCheck={false}
            />
            <span className="shrink-0 rounded-md bg-background px-2 py-1 text-[10px] font-medium tabular-nums text-muted-foreground">
              {Math.round(selectedStop.position)}%
            </span>
            <button
              type="button"
              disabled={disabled || stops.length <= MIN_STOP_COUNT}
              onClick={removeSelectedStop}
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground',
                'hover:bg-destructive/10 hover:text-destructive',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
              aria-label="Eliminar marcador"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {(leftSegmentForSelected || rightSegmentForSelected) && (
            <div className="grid grid-cols-2 gap-2">
              {leftSegmentForSelected ? (
                <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Difuminado ←</p>
                  <Slider
                    className="mt-1"
                    value={[leftSegmentForSelected.mid]}
                    min={13}
                    max={87}
                    step={1}
                    disabled={disabled}
                    onValueChange={([v]) => {
                      if (v === undefined) return;
                      updateStopAtIndex(leftSegmentForSelected.leftIndex, {
                        puntoMedio: clampMidpoint(v),
                      });
                    }}
                  >
                    <SliderThumb />
                  </Slider>
                </div>
              ) : (
                <div aria-hidden />
              )}
              {rightSegmentForSelected ? (
                <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Difuminado →</p>
                  <Slider
                    className="mt-1"
                    value={[rightSegmentForSelected.mid]}
                    min={13}
                    max={87}
                    step={1}
                    disabled={disabled}
                    onValueChange={([v]) => {
                      if (v === undefined) return;
                      updateStopAtIndex(rightSegmentForSelected.leftIndex, {
                        puntoMedio: clampMidpoint(v),
                      });
                    }}
                  >
                    <SliderThumb />
                  </Slider>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
