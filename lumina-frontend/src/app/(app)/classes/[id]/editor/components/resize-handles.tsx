'use client';

import React, { useEffect, useRef, useState } from 'react';

import { computeNewCoords } from '../lib/resize-coords';
import { computeRotationAngle } from '../lib/rotate-coords';
import { DEFAULT_BLOCK_RESIZE_MIN_DIM } from '../lib/block-resize-min-dim';

export interface ResizeHandlesProps {
  blockId: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  rotacion?: number;
  lockAspectRatio?: boolean;
  /** Mínimo ancho/alto en % del lienzo (default 5; pins/popup/progreso usan getBlockResizeMinDim). */
  minDim?: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onResize: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  onResizeEnd: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  onRotate?: (blockId: string, angle: number) => void;
  onRotateEnd?: (blockId: string, angle: number) => void;
}

type HandleDir = 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W';

const HANDLES: { dir: HandleDir; style: React.CSSProperties; cursor: string }[] = [
  { dir: 'NW', style: { top: 0,    left: 0,    transform: 'translate(-50%, -50%)' }, cursor: 'nwse-resize' },
  { dir: 'N',  style: { top: 0,    left: '50%',transform: 'translate(-50%, -50%)' }, cursor: 'ns-resize'   },
  { dir: 'NE', style: { top: 0,    right: 0,   transform: 'translate(50%, -50%)'  }, cursor: 'nesw-resize' },
  { dir: 'E',  style: { top: '50%',right: 0,   transform: 'translate(50%, -50%)'  }, cursor: 'ew-resize'   },
  { dir: 'SE', style: { bottom: 0, right: 0,   transform: 'translate(50%, 50%)'   }, cursor: 'nwse-resize' },
  { dir: 'S',  style: { bottom: 0, left: '50%',transform: 'translate(-50%, 50%)'  }, cursor: 'ns-resize'   },
  { dir: 'SW', style: { bottom: 0, left: 0,    transform: 'translate(-50%, 50%)'  }, cursor: 'nesw-resize' },
  { dir: 'W',  style: { top: '50%',left: 0,    transform: 'translate(-50%, -50%)' }, cursor: 'ew-resize'   },
];

export function ResizeHandles({
  blockId,
  x,
  y,
  ancho,
  alto,
  rotacion = 0,
  lockAspectRatio,
  minDim = DEFAULT_BLOCK_RESIZE_MIN_DIM,
  canvasRef,
  onResize,
  onResizeEnd,
  onRotate,
  onRotateEnd,
}: ResizeHandlesProps) {
  const propsRef = useRef({
    blockId,
    x,
    y,
    ancho,
    alto,
    rotacion,
    lockAspectRatio,
    minDim,
    canvasRef,
    onResize,
    onResizeEnd,
    onRotate,
    onRotateEnd,
  });
  useEffect(() => {
    propsRef.current = {
      blockId,
      x,
      y,
      ancho,
      alto,
      rotacion,
      lockAspectRatio,
      minDim,
      canvasRef,
      onResize,
      onResizeEnd,
      onRotate,
      onRotateEnd,
    };
  });

  const dragRef = useRef<{
    dir: HandleDir;
    origX: number;
    origY: number;
    origAncho: number;
    origAlto: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const rotateDragRef = useRef<{
    centerX: number;
    centerY: number;
    lastAngle: number;
  } | null>(null);

  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (rotateDragRef.current) {
        const { centerX, centerY } = rotateDragRef.current;
        const { blockId: bid, onRotate: cb } = propsRef.current;
        const angle = computeRotationAngle(centerX, centerY, e.clientX, e.clientY, {
          shiftKey: e.shiftKey,
        });
        rotateDragRef.current.lastAngle = angle;
        cb?.(bid, angle);
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const { canvasRef: cr, blockId: bid, onResize: cb, lockAspectRatio: keepRatio, minDim: minDimPct } = propsRef.current;
      const canvas = cr.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - drag.startMouseX) / rect.width)  * 100;
      const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;

      cb(
        bid,
        computeNewCoords(
          drag.dir,
          drag.origX, drag.origY, drag.origAncho, drag.origAlto,
          dxPct, dyPct,
          Boolean(keepRatio || e.shiftKey),
          minDimPct,
        ),
      );
    }

    function onMouseUp(e: MouseEvent) {
      if (rotateDragRef.current) {
        const { centerX, centerY } = rotateDragRef.current;
        const { blockId: bid, onRotateEnd: cbEnd } = propsRef.current;
        const angle = computeRotationAngle(centerX, centerY, e.clientX, e.clientY, {
          shiftKey: e.shiftKey,
        });
        rotateDragRef.current = null;
        setIsRotating(false);
        cbEnd?.(bid, angle);
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const { canvasRef: cr, blockId: bid, onResizeEnd: cb, lockAspectRatio: keepRatio, minDim: minDimPct } = propsRef.current;
      const canvas = cr.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - drag.startMouseX) / rect.width)  * 100;
      const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;

      cb(
        bid,
        computeNewCoords(
          drag.dir,
          drag.origX, drag.origY, drag.origAncho, drag.origAlto,
          dxPct, dyPct,
          Boolean(keepRatio || e.shiftKey),
          minDimPct,
        ),
      );
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      dragRef.current = null;
      rotateDragRef.current = null;
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent, dir: HandleDir) {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      dir,
      origX:      propsRef.current.x,
      origY:      propsRef.current.y,
      origAncho:  propsRef.current.ancho,
      origAlto:   propsRef.current.alto,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    };
  }

  function handleRotateMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const { canvasRef: cr, x: bx, y: by, ancho: bw, alto: bh, rotacion: currentRot } = propsRef.current;
    const canvas = cr.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const centerX = rect.left + ((bx + bw / 2) / 100) * rect.width;
    const centerY = rect.top + ((by + bh / 2) / 100) * rect.height;

    rotateDragRef.current = {
      centerX,
      centerY,
      lastAngle: currentRot,
    };
    setIsRotating(true);
  }

  const showRotate = Boolean(onRotate || onRotateEnd);

  return (
    <>
      {showRotate && (
        <>
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              width: 1,
              height: 20,
              transform: 'translateX(-50%)',
              background: '#3b82f6',
              zIndex: 49,
              pointerEvents: 'none',
            }}
          />
          <div
            onMouseDown={handleRotateMouseDown}
            title="Arrastra para rotar (Shift para pasos de 15°)"
            style={{
              position: 'absolute',
              top: -24,
              left: '50%',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: isRotating ? '#2563eb' : 'white',
              border: '1.5px solid #2563eb',
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              cursor: isRotating ? 'grabbing' : 'grab',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          />
        </>
      )}
      {HANDLES.map((handle) => (
        <div
          key={handle.dir}
          onMouseDown={(e) => handleMouseDown(e, handle.dir)}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: 'white',
            border: '1px solid #3b82f6',
            borderRadius: 2,
            zIndex: 50,
            cursor: handle.cursor,
            ...handle.style,
          }}
        />
      ))}
    </>
  );
}
