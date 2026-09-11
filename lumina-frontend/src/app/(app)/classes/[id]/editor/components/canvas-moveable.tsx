'use client';

// Etapa G · G2a — motor de interacción del lienzo sobre react-moveable +
// @lumina/canvas-align. Detrás del flag CANVAS_MOVEABLE_ENABLED (default off);
// la ruta histórica (dnd-kit + <ResizeHandles> + snapLines + <SpacingIndicators>)
// sigue intacta. G2b conmuta el default, valida el zoom 25–400 % y borra lo viejo.
//
// Contrato del editor (`.cursorrules`): leer (getBlockPos) → transformar
// (computeSnap / computeNewCoords) → clamp (clampDragCorner, dentro de
// computeSnap) → persistir (onCommit) → historial (lo hace canvas-area).

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Moveable, {
  type OnDrag,
  type OnDragEnd,
  type OnResize,
  type OnResizeEnd,
  type OnRotate,
  type OnRotateEnd,
} from 'react-moveable';

import type { Block, SlideGuias } from '@lumina/types/slide';
import {
  computeSnap,
  blockRotation,
  snapResizeSize,
  AlignmentOverlay,
  type SnapLine,
  type Measurement,
  type AlignRect,
} from '@lumina/canvas-align';

import {
  getBlockPos,
  isBlockCanvasLocked,
  withPosition,
  withRect,
  withRotation,
  clampDragCorner,
} from '@/hooks/use-block-drag';
import { computeNewCoords, type ResizeHandleDir } from '../lib/resize-coords';
import { getBlockResizeMinDim } from '../lib/block-resize-min-dim';
import { snapAngle } from '../lib/rotate-coords';

export interface CanvasMoveableProps {
  /** Elemento del lienzo en coordenadas % (SLIDE_SURFACE). Los bloques tienen `data-block-id`. */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Bloques efectivos (liveBloques → committed → servidor). */
  blocks: Block[];
  /** Índices (top-level) seleccionados. */
  selectedIndices: number[];
  /** Zoom del lienzo (1 = 100 %). */
  zoom: number;
  guias?: SlideGuias | null;
  /** true mientras Alt está pulsado — desactiva el imán. */
  snapSuppressedRef?: RefObject<boolean>;
  /** Preview por frame (sin persistir ni historial). */
  onLiveChange?: (next: Block[]) => void;
  /** Commit al soltar — canvas-area persiste + registra historial. */
  onCommit: (next: Block[]) => void;
}

const MOVEABLE_DIRECTIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function dirFromMoveable(direction: number[]): ResizeHandleDir {
  const [x, y] = direction;
  if (y < 0 && x < 0) return 'NW';
  if (y < 0 && x > 0) return 'NE';
  if (y > 0 && x < 0) return 'SW';
  if (y > 0 && x > 0) return 'SE';
  if (y < 0) return 'N';
  if (y > 0) return 'S';
  if (x < 0) return 'W';
  return 'E';
}

interface DragOrigin {
  index: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  rot: number;
}

export function CanvasMoveable({
  canvasRef,
  blocks,
  selectedIndices,
  zoom,
  guias,
  snapSuppressedRef,
  onLiveChange,
  onCommit,
}: CanvasMoveableProps) {
  const [targets, setTargets] = useState<HTMLElement[]>([]);
  const [guides, setGuides] = useState<SnapLine[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activeRect, setActiveRect] = useState<AlignRect | null>(null);
  const [activeRotation, setActiveRotation] = useState<number | undefined>(undefined);

  const originsRef = useRef<DragOrigin[]>([]);
  const liveBlocksRef = useRef<Block[]>(blocks);
  liveBlocksRef.current = blocks;

  // Índices arrastrables (no bloqueados) — canvasLocked queda fuera.
  const activeIndices = useMemo(
    () =>
      selectedIndices.filter(
        (i) => blocks[i] && !isBlockCanvasLocked(blocks[i]),
      ),
    [selectedIndices, blocks],
  );

  // Resolver los nodos DOM de la selección dentro del lienzo.
  useEffect(() => {
    const surface = canvasRef.current;
    if (!surface || activeIndices.length === 0) {
      setTargets([]);
      return;
    }
    const els = activeIndices
      .map((i) => surface.querySelector<HTMLElement>(`[data-block-id="${i}"]`))
      .filter((el): el is HTMLElement => el != null);
    setTargets(els);
  }, [canvasRef, activeIndices, blocks]);

  const rectPx = useCallback(() => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r && r.width > 0 ? r : null;
  }, [canvasRef]);

  const captureOrigins = useCallback(() => {
    originsRef.current = activeIndices.map((index) => {
      const p = getBlockPos(blocks[index]);
      return {
        index,
        x: p.x,
        y: p.y,
        ancho: p.ancho,
        alto: p.alto,
        rot: blockRotation(blocks[index]),
      };
    });
  }, [activeIndices, blocks]);

  const clearOverlay = useCallback(() => {
    setGuides([]);
    setMeasurements([]);
    setActiveRect(null);
    setActiveRotation(undefined);
  }, []);

  const applyToBlocks = useCallback(
    (mut: Map<number, Block>): Block[] =>
      liveBlocksRef.current.map((b, i) => mut.get(i) ?? b),
    [],
  );

  // ─── Drag ────────────────────────────────────────────────────────────────
  const handleDrag = useCallback(
    (e: OnDrag) => {
      const rect = rectPx();
      const origins = originsRef.current;
      if (!rect || origins.length === 0) return;
      const dxPct = (e.dist[0] / rect.width) * 100;
      const dyPct = (e.dist[1] / rect.height) * 100;
      const enabled = !snapSuppressedRef?.current;

      const mut = new Map<number, Block>();

      if (origins.length === 1) {
        const o = origins[0];
        const { rect: snapped, guides: g, measurements: m } = computeSnap(
          o.x + dxPct,
          o.y + dyPct,
          o.ancho,
          o.alto,
          o.index,
          liveBlocksRef.current,
          { guias, enabled, zoom, rotacionDeg: o.rot },
        );
        mut.set(o.index, withPosition(liveBlocksRef.current[o.index], snapped.x, snapped.y));
        setGuides(g);
        setMeasurements(m);
        setActiveRect({ x: snapped.x, y: snapped.y, ancho: o.ancho, alto: o.alto });
        setActiveRotation(o.rot % 360 !== 0 ? o.rot : undefined);
      } else {
        // Grupo: traslación + clamp por bloque, sin overlay (G2b lo enriquece).
        for (const o of origins) {
          const { x, y } = clampDragCorner(o.x + dxPct, o.y + dyPct, o.ancho, o.alto);
          mut.set(o.index, withPosition(liveBlocksRef.current[o.index], x, y));
        }
      }

      onLiveChange?.(applyToBlocks(mut));
    },
    [rectPx, snapSuppressedRef, guias, zoom, onLiveChange, applyToBlocks],
  );

  // ─── Resize ──────────────────────────────────────────────────────────────
  const handleResize = useCallback(
    (e: OnResize) => {
      const rect = rectPx();
      const origins = originsRef.current;
      if (!rect || origins.length !== 1) return;
      const o = origins[0];
      const dir = dirFromMoveable(e.direction);
      const dxPct = (e.dist[0] / rect.width) * 100;
      const dyPct = (e.dist[1] / rect.height) * 100;
      const enabled = !snapSuppressedRef?.current;
      const minDim = getBlockResizeMinDim(liveBlocksRef.current[o.index].tipo);

      let next = computeNewCoords(
        dir,
        o.x,
        o.y,
        o.ancho,
        o.alto,
        dxPct,
        dyPct,
        Boolean(e.inputEvent?.shiftKey),
        minDim,
      );

      // Snap de tamaño a vecinos / fracciones (solo si el origen no se mueve).
      if ((dir === 'E' || dir === 'S' || dir === 'SE') && enabled) {
        const peerPos = liveBlocksRef.current
          .filter((_, i) => i !== o.index)
          .map(getBlockPos);
        const sized = snapResizeSize(next.ancho, next.alto, peerPos, { zoom, enabled });
        next = { ...next, ancho: sized.ancho, alto: sized.alto };
      }

      const { rect: snapped, guides: g, measurements: m } = computeSnap(
        next.x,
        next.y,
        next.ancho,
        next.alto,
        o.index,
        liveBlocksRef.current,
        { guias, enabled, zoom, rotacionDeg: o.rot },
      );

      const mut = new Map<number, Block>();
      mut.set(
        o.index,
        withRect(liveBlocksRef.current[o.index], snapped.x, snapped.y, next.ancho, next.alto),
      );
      setGuides(g);
      setMeasurements(m);
      setActiveRect({ x: snapped.x, y: snapped.y, ancho: next.ancho, alto: next.alto });
      setActiveRotation(o.rot % 360 !== 0 ? o.rot : undefined);
      onLiveChange?.(applyToBlocks(mut));
    },
    [rectPx, snapSuppressedRef, guias, zoom, onLiveChange, applyToBlocks],
  );

  // ─── Rotate ──────────────────────────────────────────────────────────────
  const handleRotate = useCallback(
    (e: OnRotate) => {
      const origins = originsRef.current;
      if (origins.length !== 1) return;
      const o = origins[0];
      const snapped = snapAngle(e.rotation, { shiftKey: Boolean(e.inputEvent?.shiftKey) });
      const mut = new Map<number, Block>();
      mut.set(o.index, withRotation(liveBlocksRef.current[o.index], snapped));
      setActiveRect({ x: o.x, y: o.y, ancho: o.ancho, alto: o.alto });
      setActiveRotation(snapped % 360 !== 0 ? snapped : undefined);
      setGuides([]);
      setMeasurements([]);
      onLiveChange?.(applyToBlocks(mut));
    },
    [onLiveChange, applyToBlocks],
  );

  const commit = useCallback(() => {
    onCommit(liveBlocksRef.current);
    clearOverlay();
    originsRef.current = [];
  }, [onCommit, clearOverlay]);

  const handleDragEnd = useCallback((_e: OnDragEnd) => commit(), [commit]);
  const handleResizeEnd = useCallback((_e: OnResizeEnd) => commit(), [commit]);
  const handleRotateEnd = useCallback((_e: OnRotateEnd) => commit(), [commit]);

  if (targets.length === 0) return null;

  const single = targets.length === 1;

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <AlignmentOverlay
          guides={guides}
          measurements={measurements}
          activeRect={activeRect}
          zoom={zoom}
          rotationDeg={activeRotation}
        />
      </div>
      <Moveable
        target={single ? targets[0] : targets}
        rootContainer={canvasRef.current ?? undefined}
        origin={false}
        draggable
        resizable={single}
        rotatable={single}
        renderDirections={single ? MOVEABLE_DIRECTIONS : []}
        throttleDrag={0}
        throttleResize={0}
        throttleRotate={0}
        onDragStart={captureOrigins}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragGroupStart={captureOrigins}
        onDragGroup={({ events }) => events[0] && handleDrag(events[0])}
        onDragGroupEnd={handleDragEnd}
        onResizeStart={captureOrigins}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        onRotateStart={captureOrigins}
        onRotate={handleRotate}
        onRotateEnd={handleRotateEnd}
      />
    </>
  );
}
