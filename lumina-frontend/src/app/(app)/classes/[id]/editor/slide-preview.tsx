'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const CANVAS_W = 1280;
const CANVAS_H = 720;

interface Props {
  content: unknown;
  /** Display width in px (canvas is scaled via CSS) */
  displayWidth?: number;
}

export default function SlidePreviewCanvas({ content, displayWidth = 960 }: Props) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const scale = displayWidth / CANVAS_W;
  const displayHeight = CANVAS_H * scale;

  // Init canvas
  useEffect(() => {
    if (!canvasEl.current) return;
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: '#ffffff',
      selection: false,
      renderOnAddRemove: false,
    });
    fabricRef.current = canvas;
    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Load content
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const c = content as { fabricJSON?: object; background?: { value?: string } } | null | undefined;
    const bg = c?.background?.value ?? '#ffffff';

    if (c?.fabricJSON) {
      canvas.loadFromJSON(c.fabricJSON, () => {
        // Make all objects non-interactive for preview
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
          obj.hoverCursor = 'default';
        });
        canvas.setBackgroundColor(bg, () => canvas.renderAll());
      });
    } else {
      canvas.clear();
      canvas.setBackgroundColor(bg, () => canvas.renderAll());
    }
  }, [content]);

  return (
    // Outer wrapper matches the visually scaled size
    <div style={{ width: displayWidth, height: displayHeight, position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <canvas ref={canvasEl} />
      </div>
    </div>
  );
}
