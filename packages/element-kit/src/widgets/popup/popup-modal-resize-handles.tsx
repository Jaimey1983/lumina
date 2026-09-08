'use client';

import { useEffect, useRef } from 'react';

type HandleDir = 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W';

const MIN_ANCHO = 25;
const MAX_ANCHO = 96;
const MIN_ALTO = 20;
const MAX_ALTO = 92;

const HANDLES: { dir: HandleDir; style: React.CSSProperties; cursor: string }[] = [
  { dir: 'NW', style: { top: 0, left: 0, transform: 'translate(-50%, -50%)' }, cursor: 'nwse-resize' },
  { dir: 'N', style: { top: 0, left: '50%', transform: 'translate(-50%, -50%)' }, cursor: 'ns-resize' },
  { dir: 'NE', style: { top: 0, right: 0, transform: 'translate(50%, -50%)' }, cursor: 'nesw-resize' },
  { dir: 'E', style: { top: '50%', right: 0, transform: 'translate(50%, -50%)' }, cursor: 'ew-resize' },
  { dir: 'SE', style: { bottom: 0, right: 0, transform: 'translate(50%, 50%)' }, cursor: 'nwse-resize' },
  { dir: 'S', style: { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }, cursor: 'ns-resize' },
  { dir: 'SW', style: { bottom: 0, left: 0, transform: 'translate(-50%, 50%)' }, cursor: 'nesw-resize' },
  { dir: 'W', style: { top: '50%', left: 0, transform: 'translate(-50%, -50%)' }, cursor: 'ew-resize' },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeModalSize(
  dir: HandleDir,
  origAncho: number,
  origAlto: number,
  dxPct: number,
  dyPct: number,
): { modalAnchoPct: number; modalAltoPct: number } {
  let ancho = origAncho;
  let alto = origAlto;

  switch (dir) {
    case 'E':
      ancho = origAncho + dxPct;
      break;
    case 'W':
      ancho = origAncho - dxPct;
      break;
    case 'S':
      alto = origAlto + dyPct;
      break;
    case 'N':
      alto = origAlto - dyPct;
      break;
    case 'SE':
      ancho = origAncho + dxPct;
      alto = origAlto + dyPct;
      break;
    case 'SW':
      ancho = origAncho - dxPct;
      alto = origAlto + dyPct;
      break;
    case 'NE':
      ancho = origAncho + dxPct;
      alto = origAlto - dyPct;
      break;
    case 'NW':
      ancho = origAncho - dxPct;
      alto = origAlto - dyPct;
      break;
  }

  return {
    modalAnchoPct: clamp(ancho, MIN_ANCHO, MAX_ANCHO),
    modalAltoPct: clamp(alto, MIN_ALTO, MAX_ALTO),
  };
}

export interface PopupModalResizeHandlesProps {
  modalAnchoPct: number;
  modalAltoPct: number;
  slideRoot: HTMLElement | null;
  onResize: (size: { modalAnchoPct: number; modalAltoPct: number }) => void;
  onResizeEnd: (size: { modalAnchoPct: number; modalAltoPct: number }) => void;
}

export function PopupModalResizeHandles({
  modalAnchoPct,
  modalAltoPct,
  slideRoot,
  onResize,
  onResizeEnd,
}: PopupModalResizeHandlesProps) {
  const propsRef = useRef({ modalAnchoPct, modalAltoPct, slideRoot, onResize, onResizeEnd });
  useEffect(() => {
    propsRef.current = { modalAnchoPct, modalAltoPct, slideRoot, onResize, onResizeEnd };
  });

  const dragRef = useRef<{
    dir: HandleDir;
    origAncho: number;
    origAlto: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const { slideRoot: root, onResize: cb } = propsRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - drag.startMouseX) / rect.width) * 100;
      const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;
      cb(computeModalSize(drag.dir, drag.origAncho, drag.origAlto, dxPct, dyPct));
    }

    function onMouseUp(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const { slideRoot: root, onResizeEnd: cb } = propsRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - drag.startMouseX) / rect.width) * 100;
      const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;
      cb(computeModalSize(drag.dir, drag.origAncho, drag.origAlto, dxPct, dyPct));
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dragRef.current = null;
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent, dir: HandleDir) {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      dir,
      origAncho: propsRef.current.modalAnchoPct,
      origAlto: propsRef.current.modalAltoPct,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    };
  }

  return (
    <>
      {HANDLES.map((handle) => (
        <div
          key={handle.dir}
          data-popup-modal-resize-handle
          role="presentation"
          onMouseDown={(e) => handleMouseDown(e, handle.dir)}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: 'white',
            border: '1px solid #3b82f6',
            borderRadius: 2,
            zIndex: 60,
            cursor: handle.cursor,
            pointerEvents: 'auto',
            ...handle.style,
          }}
        />
      ))}
    </>
  );
}
