'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

import type { SlideGuias } from '@/types/slide.types';
import { cn } from '@/lib/utils';
import {
  RULER_SIZE_PX,
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
  clientToVirtual,
  isPointerInsideCanvas,
  rulerMarksX,
  rulerMarksY,
  virtualXToPercent,
  virtualYToPercent,
} from '@/lib/canvas-guides';

type GuideOrientation = 'horizontal' | 'vertical';

type GuideInteraction =
  | { kind: 'create'; orientation: GuideOrientation; position: number }
  | { kind: 'move'; orientation: GuideOrientation; index: number; position: number };

interface CanvasGuidesChromeProps {
  visible: boolean;
  /** Clases del viewport 16:9 (p. ej. SLIDE_VIEWPORT_CLASS). */
  viewportClassName: string;
  guias: SlideGuias;
  onGuiasChange: (next: SlideGuias) => void;
  canvasRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

function useGuideInteraction({
  canvasRef,
  guias,
  onGuiasChange,
  enabled,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  guias: SlideGuias;
  onGuiasChange: (next: SlideGuias) => void;
  enabled: boolean;
}) {
  const [interaction, setInteraction] = useState<GuideInteraction | null>(null);
  const interactionRef = useRef<GuideInteraction | null>(null);
  const guiasRef = useRef(guias);
  interactionRef.current = interaction;
  guiasRef.current = guias;

  const startCreate = useCallback((orientation: GuideOrientation) => {
    if (!enabled) return;
    const initial =
      orientation === 'horizontal'
        ? VIRTUAL_CANVAS_HEIGHT / 2
        : VIRTUAL_CANVAS_WIDTH / 2;
    setInteraction({ kind: 'create', orientation, position: initial });
  }, [enabled]);

  const startMove = useCallback(
    (orientation: GuideOrientation, index: number) => {
      if (!enabled) return;
      const position =
        orientation === 'horizontal'
          ? guias.horizontales[index] ?? 0
          : guias.verticales[index] ?? 0;
      setInteraction({ kind: 'move', orientation, index, position });
    },
    [enabled, guias.horizontales, guias.verticales],
  );

  const deleteGuide = useCallback(
    (orientation: GuideOrientation, index: number) => {
      const g = guiasRef.current;
      if (orientation === 'horizontal') {
        onGuiasChange({
          ...g,
          horizontales: g.horizontales.filter((_, i) => i !== index),
        });
      } else {
        onGuiasChange({
          ...g,
          verticales: g.verticales.filter((_, i) => i !== index),
        });
      }
    },
    [onGuiasChange],
  );

  useEffect(() => {
    if (!interaction) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { x, y } = clientToVirtual(e.clientX, e.clientY, rect);
      setInteraction((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          position: prev.orientation === 'horizontal' ? y : x,
        };
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      const current = interactionRef.current;
      if (!current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      const inside = rect ? isPointerInsideCanvas(e.clientX, e.clientY, rect) : false;

      const g = guiasRef.current;
      if (current.kind === 'create') {
        if (inside) {
          if (current.orientation === 'horizontal') {
            onGuiasChange({
              ...g,
              horizontales: [...g.horizontales, current.position],
            });
          } else {
            onGuiasChange({
              ...g,
              verticales: [...g.verticales, current.position],
            });
          }
        }
      } else if (current.kind === 'move') {
        if (!inside) {
          deleteGuide(current.orientation, current.index);
        } else if (current.orientation === 'horizontal') {
          const horizontales = [...g.horizontales];
          horizontales[current.index] = current.position;
          onGuiasChange({ ...g, horizontales });
        } else {
          const verticales = [...g.verticales];
          verticales[current.index] = current.position;
          onGuiasChange({ ...g, verticales });
        }
      }

      setInteraction(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [interaction, canvasRef, guias, onGuiasChange, deleteGuide]);

  return { interaction, startCreate, startMove, deleteGuide };
}

function RulerCorner({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'border-b border-r border-[#E5E7EB] bg-[#F9FAFB]',
        className,
      )}
      style={{ width: RULER_SIZE_PX, height: RULER_SIZE_PX, ...style }}
      aria-hidden
    />
  );
}

function HorizontalRuler({ onStartDrag }: { onStartDrag: () => void }) {
  return (
    <div
      role="presentation"
      className="relative h-4 w-full min-w-0 cursor-ns-resize select-none overflow-hidden border-b border-[#E5E7EB] bg-[#F9FAFB]"
      style={{ height: RULER_SIZE_PX }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStartDrag();
      }}
    >
      {rulerMarksX().map((px) => (
          <span
            key={px}
            className="pointer-events-none absolute bottom-0 -translate-x-1/2 text-[9px] leading-none text-[#9CA3AF]"
            style={{ left: `${(px / VIRTUAL_CANVAS_WIDTH) * 100}%` }}
          >
            <span
              className="absolute bottom-full left-1/2 mb-px block h-1 w-px -translate-x-1/2 bg-[#E5E7EB]"
              aria-hidden
            />
            {px}
          </span>
        ))}
    </div>
  );
}

function VerticalRuler({ onStartDrag }: { onStartDrag: () => void }) {
  return (
    <div
      role="presentation"
      className="relative h-full w-4 min-h-0 cursor-ew-resize select-none overflow-hidden border-r border-[#E5E7EB] bg-[#F9FAFB]"
      style={{ width: RULER_SIZE_PX }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStartDrag();
      }}
    >
      {rulerMarksY().map((px) => (
          <span
            key={px}
            className="pointer-events-none absolute left-0 -translate-y-1/2 pl-0.5 text-[9px] leading-none text-[#9CA3AF]"
            style={{ top: `${(px / VIRTUAL_CANVAS_HEIGHT) * 100}%` }}
          >
            <span
              className="absolute top-1/2 left-full ml-px block h-px w-1 -translate-y-1/2 bg-[#E5E7EB]"
              aria-hidden
            />
            {px}
          </span>
        ))}
    </div>
  );
}

function GuidePositionBadge({
  orientation,
  position,
}: {
  orientation: GuideOrientation;
  position: number;
}) {
  const style: React.CSSProperties =
    orientation === 'horizontal'
      ? { top: `${virtualYToPercent(position)}%`, left: 8, transform: 'translateY(-50%)' }
      : { left: `${virtualXToPercent(position)}%`, top: 8, transform: 'translateX(-50%)' };

  return (
    <div
      className="pointer-events-none absolute z-[60] rounded bg-[#2563EB] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white shadow-sm"
      style={style}
    >
      {Math.round(position)}px
    </div>
  );
}

function HorizontalGuideLine({
  y,
  isPreview,
  isActive,
  onPointerDown,
  onDoubleClick,
}: {
  y: number;
  isPreview?: boolean;
  isActive?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const interactive = !isPreview && Boolean(onPointerDown);

  return (
    <div
      className={cn('absolute left-0 right-0', interactive && 'z-[22] pointer-events-auto')}
      style={{ top: `${virtualYToPercent(y)}%`, height: 0 }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'absolute left-0 right-0',
          isPreview ? 'border-t border-dashed border-[#2563EB]/80' : 'h-px bg-[#2563EB]',
        )}
        style={{
          top: 0,
          opacity: isPreview ? 0.8 : hovered || isActive ? 1 : 0.6,
          pointerEvents: 'none',
        }}
      />
      {interactive && (
        <div
          className="absolute -top-1 left-0 right-0 h-2"
          style={{
            pointerEvents: 'auto',
            cursor: 'ns-resize',
          }}
        />
      )}
    </div>
  );
}

function VerticalGuideLine({
  x,
  isPreview,
  isActive,
  onPointerDown,
  onDoubleClick,
}: {
  x: number;
  isPreview?: boolean;
  isActive?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const interactive = !isPreview && Boolean(onPointerDown);

  return (
    <div
      className={cn('absolute top-0 bottom-0', interactive && 'z-[22] pointer-events-auto')}
      style={{ left: `${virtualXToPercent(x)}%`, width: 0 }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'absolute top-0 bottom-0',
          isPreview ? 'border-l border-dashed border-[#2563EB]/80' : 'w-px bg-[#2563EB]',
        )}
        style={{
          left: 0,
          opacity: isPreview ? 0.8 : hovered || isActive ? 1 : 0.6,
          pointerEvents: 'none',
        }}
      />
      {interactive && (
        <div
          className="absolute top-0 bottom-0 -left-1 w-2"
          style={{
            pointerEvents: 'auto',
            cursor: 'ew-resize',
          }}
        />
      )}
    </div>
  );
}

function CanvasGuidesOverlay({
  active,
  guias,
  interaction,
  startMove,
  deleteGuide,
}: {
  active: boolean;
  guias: SlideGuias;
  interaction: GuideInteraction | null;
  startMove: (orientation: GuideOrientation, index: number) => void;
  deleteGuide: (orientation: GuideOrientation, index: number) => void;
}) {
  const previewH =
    interaction?.kind === 'create' && interaction.orientation === 'horizontal'
      ? interaction
      : interaction?.kind === 'move' && interaction.orientation === 'horizontal'
        ? interaction
        : null;
  const previewV =
    interaction?.kind === 'create' && interaction.orientation === 'vertical'
      ? interaction
      : interaction?.kind === 'move' && interaction.orientation === 'vertical'
        ? interaction
        : null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[21] overflow-visible"
      aria-hidden={!active}
    >
      {active && (
        <>
          {guias.horizontales.map((y, index) => {
            const isMoving =
              interaction?.kind === 'move' &&
              interaction.orientation === 'horizontal' &&
              interaction.index === index;
            if (isMoving) return null;
            return (
              <HorizontalGuideLine
                key={`h-${index}-${y}`}
                y={y}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startMove('horizontal', index);
                }}
                onDoubleClick={() => deleteGuide('horizontal', index)}
              />
            );
          })}
          {guias.verticales.map((x, index) => {
            const isMoving =
              interaction?.kind === 'move' &&
              interaction.orientation === 'vertical' &&
              interaction.index === index;
            if (isMoving) return null;
            return (
              <VerticalGuideLine
                key={`v-${index}-${x}`}
                x={x}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startMove('vertical', index);
                }}
                onDoubleClick={() => deleteGuide('vertical', index)}
              />
            );
          })}

          {previewH && (
            <HorizontalGuideLine y={previewH.position} isPreview isActive />
          )}
          {previewV && (
            <VerticalGuideLine x={previewV.position} isPreview isActive />
          )}

          {interaction && (
            <GuidePositionBadge
              orientation={interaction.orientation}
              position={interaction.position}
            />
          )}
        </>
      )}
    </div>
  );
}

export function CanvasGuidesChrome({
  visible,
  viewportClassName,
  guias,
  onGuiasChange,
  canvasRef,
  children,
}: CanvasGuidesChromeProps) {
  const { interaction, startCreate, startMove, deleteGuide } = useGuideInteraction({
    canvasRef,
    guias,
    onGuiasChange,
    enabled: visible,
  });

  return (
    <div
      data-canvas-viewport
      className={cn(viewportClassName, 'overflow-visible')}
    >
      {children}
      <CanvasGuidesOverlay
        active={visible}
        guias={guias}
        interaction={interaction}
        startMove={startMove}
        deleteGuide={deleteGuide}
      />
      {visible && (
        <>
          <RulerCorner
            className="pointer-events-none absolute z-[8]"
            style={{ top: -RULER_SIZE_PX, left: -RULER_SIZE_PX }}
          />
          <div
            className="pointer-events-auto absolute z-[8]"
            style={{
              top: -RULER_SIZE_PX,
              left: 0,
              right: 0,
              height: RULER_SIZE_PX,
            }}
          >
            <HorizontalRuler onStartDrag={() => startCreate('horizontal')} />
          </div>
          <div
            className="pointer-events-auto absolute z-[8]"
            style={{
              top: 0,
              left: -RULER_SIZE_PX,
              width: RULER_SIZE_PX,
              bottom: 0,
            }}
          >
            <VerticalRuler onStartDrag={() => startCreate('vertical')} />
          </div>
        </>
      )}
    </div>
  );
}
