'use client';

import React, { useEffect, useRef } from 'react';

export interface ResizeHandlesProps {
  blockId: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onResize: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  onResizeEnd: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
}

type HandleDir = 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W';

const HANDLES: { dir: HandleDir; className: string; cursor: string }[] = [
  { dir: 'NW', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2', cursor: 'nwse-resize' },
  { dir: 'N',  className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', cursor: 'ns-resize' },
  { dir: 'NE', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2', cursor: 'nesw-resize' },
  { dir: 'E',  className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2', cursor: 'ew-resize' },
  { dir: 'SE', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2', cursor: 'nwse-resize' },
  { dir: 'S',  className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', cursor: 'ns-resize' },
  { dir: 'SW', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2', cursor: 'nesw-resize' },
  { dir: 'W',  className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2', cursor: 'ew-resize' },
];

export function ResizeHandles({ blockId, x, y, ancho, alto, canvasRef, onResize, onResizeEnd }: ResizeHandlesProps) {
  const isDragging = useRef(false);

  const startDrag = (e: React.MouseEvent, dir: HandleDir) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canvasRef.current) return;

    isDragging.current = true;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const startX = x;
    const startY = y;
    const startW = ancho;
    const startH = alto;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;

      const deltaPercentX = (deltaX / canvasRect.width) * 100;
      const deltaPercentY = (deltaY / canvasRect.height) * 100;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      if (dir.includes('E')) newW = startW + deltaPercentX;
      if (dir.includes('S')) newH = startH + deltaPercentY;
      if (dir.includes('W')) {
        newX = startX + deltaPercentX;
        newW = startW - deltaPercentX;
      }
      if (dir.includes('N')) {
        newY = startY + deltaPercentY;
        newH = startH - deltaPercentY;
      }

      if (newW < 5) {
        if (dir.includes('W')) newX = startX + startW - 5;
        newW = 5;
      }
      if (newH < 5) {
        if (dir.includes('N')) newY = startY + startH - 5;
        newH = 5;
      }

      onResize(blockId, { x: newX, y: newY, ancho: newW, alto: newH });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const deltaX = upEvent.clientX - startMouseX;
      const deltaY = upEvent.clientY - startMouseY;

      const deltaPercentX = (deltaX / canvasRect.width) * 100;
      const deltaPercentY = (deltaY / canvasRect.height) * 100;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      if (dir.includes('E')) newW = startW + deltaPercentX;
      if (dir.includes('S')) newH = startH + deltaPercentY;
      if (dir.includes('W')) {
        newX = startX + deltaPercentX;
        newW = startW - deltaPercentX;
      }
      if (dir.includes('N')) {
        newY = startY + deltaPercentY;
        newH = startH - deltaPercentY;
      }

      if (newW < 5) {
        if (dir.includes('W')) newX = startX + startW - 5;
        newW = 5;
      }
      if (newH < 5) {
        if (dir.includes('N')) newY = startY + startH - 5;
        newH = 5;
      }

      onResizeEnd(blockId, { x: newX, y: newY, ancho: newW, alto: newH });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      isDragging.current = false;
    };
  }, []);

  return (
    <>
      {HANDLES.map((handle) => (
        <div
          key={handle.dir}
          onMouseDown={(e) => startDrag(e, handle.dir)}
          className={`absolute size-2.5 bg-white border border-blue-500 rounded-sm z-50 ${handle.className}`}
          style={{ cursor: handle.cursor }}
        />
      ))}
    </>
  );
}
