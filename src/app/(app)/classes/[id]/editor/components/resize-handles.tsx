'use client';

import React, { useEffect, useRef } from 'react';

export interface ResizeHandlesProps {
  blockId: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  lockAspectRatio?: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onResize: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  onResizeEnd: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
}

type HandleDir = 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W';

function isCornerHandle(dir: HandleDir): dir is 'NW' | 'NE' | 'SE' | 'SW' {
  return dir === 'NW' || dir === 'NE' || dir === 'SE' || dir === 'SW';
}

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

const MIN_DIM = 5;

function clampPos(v: number): number {
  return Math.max(-50, Math.min(150, v));
}

function computeNewCoords(
  dir: HandleDir,
  origX: number,
  origY: number,
  origAncho: number,
  origAlto: number,
  dxPct: number,
  dyPct: number,
  lockAspectRatio = false,
): { x: number; y: number; ancho: number; alto: number } {
  if (lockAspectRatio && isCornerHandle(dir) && origAncho > 0 && origAlto > 0) {
    const ratio = origAncho / origAlto;
    const anchorX = origX + origAncho;
    const anchorY = origY + origAlto;

    const widthDelta = (dir === 'SE' || dir === 'NE') ? dxPct : -dxPct;
    const heightDelta = (dir === 'SE' || dir === 'SW') ? dyPct : -dyPct;

    const rawWidth = origAncho + widthDelta;
    const rawHeight = origAlto + heightDelta;

    let ancho = rawWidth;
    let alto = rawHeight;

    // Use the dominant axis as driver while preserving original ratio.
    if (Math.abs(widthDelta) >= Math.abs(heightDelta) * ratio) {
      alto = ancho / ratio;
    } else {
      ancho = alto * ratio;
    }

    // Keep dimensions positive and above the minimum while preserving ratio.
    if (ancho < MIN_DIM) {
      ancho = MIN_DIM;
      alto = ancho / ratio;
    }
    if (alto < MIN_DIM) {
      alto = MIN_DIM;
      ancho = alto * ratio;
    }

    let x = origX;
    let y = origY;

    if (dir === 'NW' || dir === 'SW') x = anchorX - ancho;
    if (dir === 'NW' || dir === 'NE') y = anchorY - alto;

    x = clampPos(x);
    y = clampPos(y);

    return { x, y, ancho, alto };
  }

  let x     = origX;
  let y     = origY;
  let ancho = origAncho;
  let alto  = origAlto;

  switch (dir) {
    case 'E':
      ancho = origAncho + dxPct;
      break;
    case 'W':
      x     = origX + dxPct;
      ancho = origAncho - dxPct;
      break;
    case 'S':
      alto = origAlto + dyPct;
      break;
    case 'N':
      y    = origY + dyPct;
      alto = origAlto - dyPct;
      break;
    case 'SE':
      ancho = origAncho + dxPct;
      alto  = origAlto  + dyPct;
      break;
    case 'SW':
      x     = origX + dxPct;
      ancho = origAncho - dxPct;
      alto  = origAlto  + dyPct;
      break;
    case 'NE':
      y     = origY + dyPct;
      alto  = origAlto  - dyPct;
      ancho = origAncho + dxPct;
      break;
    case 'NW':
      x     = origX + dxPct;
      ancho = origAncho - dxPct;
      y     = origY + dyPct;
      alto  = origAlto  - dyPct;
      break;
  }

  // Clamp minimum width: prevent x from shifting past the right edge.
  if (ancho < MIN_DIM) {
    if (dir === 'W' || dir === 'NW' || dir === 'SW') {
      x = origX + origAncho - MIN_DIM;
    }
    ancho = MIN_DIM;
  }

  // Clamp minimum height: prevent y from shifting past the bottom edge.
  if (alto < MIN_DIM) {
    if (dir === 'N' || dir === 'NW' || dir === 'NE') {
      y = origY + origAlto - MIN_DIM;
    }
    alto = MIN_DIM;
  }

  x = clampPos(x);
  y = clampPos(y);

  return { x, y, ancho, alto };
}

export function ResizeHandles({
  blockId,
  x,
  y,
  ancho,
  alto,
  lockAspectRatio,
  canvasRef,
  onResize,
  onResizeEnd,
}: ResizeHandlesProps) {
  // Store current props in a ref so the mouse-event closures can always read
  // the latest values without being recreated.
  const propsRef = useRef({ blockId, x, y, ancho, alto, lockAspectRatio, canvasRef, onResize, onResizeEnd });
  useEffect(() => {
    propsRef.current = { blockId, x, y, ancho, alto, lockAspectRatio, canvasRef, onResize, onResizeEnd };
  });

  // One ref per active drag session, reset on each mousedown.
  const dragRef = useRef<{
    dir: HandleDir;
    origX: number;
    origY: number;
    origAncho: number;
    origAlto: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  // Attach window-level handlers once; read live values through refs.
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const { canvasRef: cr, blockId: bid, onResize: cb, lockAspectRatio: keepRatio } = propsRef.current;
      const canvas = cr.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - drag.startMouseX) / rect.width)  * 100;
      const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;

      const next = computeNewCoords(
        drag.dir,
        drag.origX, drag.origY, drag.origAncho, drag.origAlto,
        dxPct, dyPct,
        Boolean(keepRatio || e.shiftKey),
      );
      cb(bid, next);
    }

    function onMouseUp(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const { canvasRef: cr, blockId: bid, onResizeEnd: cb, lockAspectRatio: keepRatio } = propsRef.current;
      const canvas = cr.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - drag.startMouseX) / rect.width)  * 100;
      const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;

      const next = computeNewCoords(
        drag.dir,
        drag.origX, drag.origY, drag.origAncho, drag.origAlto,
        dxPct, dyPct,
        Boolean(keepRatio || e.shiftKey),
      );
      cb(bid, next);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      dragRef.current = null;
    };
  }, []); // registered once; reads current values through propsRef / dragRef

  function handleMouseDown(e: React.MouseEvent, dir: HandleDir) {
    e.stopPropagation();
    e.preventDefault();
    // Snapshot block position at the moment the drag starts.
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

  return (
    <>
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
