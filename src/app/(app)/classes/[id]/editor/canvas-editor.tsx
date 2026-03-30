'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlideContent {
  version: string;
  background: { type: 'color'; value: string };
  width: number;
  height: number;
  fabricJSON?: object;
}

export interface SelectedObjectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  type: string;
}

export interface CanvasEditorAPI {
  save: () => SlideContent;
  addText: () => void;
  addImage: (url: string) => void;
  addRect: () => void;
  addCircle: () => void;
  addButton: () => void;
  deleteSelected: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  setProperty: (key: string, value: unknown) => void;
  setBackground: (color: string) => void;
}

interface CanvasEditorProps {
  content: unknown;
  onSelectionChange: (props: SelectedObjectProps | null) => void;
  onReady: (api: CanvasEditorAPI) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractProps(obj: fabric.Object): SelectedObjectProps {
  const br = obj.getBoundingRect();
  return {
    x: Math.round(obj.left ?? 0),
    y: Math.round(obj.top ?? 0),
    width: Math.round(br.width),
    height: Math.round(br.height),
    fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
    stroke: obj.stroke ?? '',
    strokeWidth: obj.strokeWidth ?? 0,
    opacity: Math.round((obj.opacity ?? 1) * 100) / 100,
    type: obj.type ?? 'object',
  };
}

function isFabricJSON(v: unknown): v is { fabricJSON: object; background?: { value?: string } } {
  return typeof v === 'object' && v !== null && 'fabricJSON' in v;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CanvasEditor({ content, onSelectionChange, onReady }: CanvasEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);

  // Keep callbacks in refs to avoid stale closures
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onReadyRef = useRef(onReady);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // ── Initialize Fabric canvas ────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const notify = () => {
      const obj = canvas.getActiveObject();
      onSelectionChangeRef.current(obj ? extractProps(obj) : null);
    };

    canvas.on('selection:created', notify);
    canvas.on('selection:updated', notify);
    canvas.on('object:modified', notify);
    canvas.on('object:scaling', notify);
    canvas.on('object:moving', notify);
    canvas.on('selection:cleared', () => onSelectionChangeRef.current(null));

    // ── Expose imperative API ──────────────────────────────────────────────────
    const api: CanvasEditorAPI = {
      save: () => {
        const bg =
          typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor : '#ffffff';
        return {
          version: '1.0',
          background: { type: 'color', value: bg },
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          fabricJSON: canvas.toJSON(['data']),
        };
      },
      addText: () => {
        const text = new fabric.Textbox('Texto nuevo', {
          left: 160,
          top: 200,
          width: 400,
          fontSize: 36,
          fill: '#111827',
          fontFamily: 'sans-serif',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
      },
      addImage: (url: string) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            const w = img.width ?? 400;
            const h = img.height ?? 300;
            const s = Math.min(500 / w, 350 / h, 1);
            img.set({ left: 200, top: 150, scaleX: s, scaleY: s });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
          },
          { crossOrigin: 'anonymous' },
        );
      },
      addRect: () => {
        const rect = new fabric.Rect({
          left: 200,
          top: 200,
          width: 300,
          height: 200,
          fill: '#4f46e5',
          rx: 8,
          ry: 8,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
      },
      addCircle: () => {
        const circle = new fabric.Circle({
          left: 300,
          top: 200,
          radius: 100,
          fill: '#0ea5e9',
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.renderAll();
      },
      addButton: () => {
        const rect = new fabric.Rect({
          width: 200,
          height: 52,
          fill: '#4f46e5',
          rx: 10,
          ry: 10,
        });
        const label = new fabric.Text('Botón', {
          fontSize: 20,
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
          left: 100,
          top: 26,
          selectable: false,
          evented: false,
        });
        const group = new fabric.Group([rect, label], {
          left: 300,
          top: 280,
          data: { interactive: true, type: 'button' },
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
      },
      deleteSelected: () => {
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.remove(obj);
          canvas.renderAll();
        }
      },
      bringToFront: () => {
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.bringToFront(obj);
          canvas.renderAll();
        }
      },
      sendToBack: () => {
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.sendToBack(obj);
          canvas.renderAll();
        }
      },
      setProperty: (key: string, value: unknown) => {
        const obj = canvas.getActiveObject();
        if (!obj) return;
        obj.set(key as keyof fabric.Object, value as never);
        canvas.requestRenderAll();
        onSelectionChangeRef.current(extractProps(obj));
      },
      setBackground: (color: string) => {
        canvas.setBackgroundColor(color, () => canvas.renderAll());
      },
    };

    onReadyRef.current(api);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load slide content when it changes ─────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const bg = isFabricJSON(content)
      ? ((content as { background?: { value?: string } }).background?.value ?? '#ffffff')
      : '#ffffff';

    if (isFabricJSON(content)) {
      canvas.loadFromJSON(content.fabricJSON, () => {
        canvas.setBackgroundColor(bg, () => canvas.renderAll());
      });
    } else {
      canvas.clear();
      canvas.setBackgroundColor(bg, () => canvas.renderAll());
    }

    canvas.discardActiveObject();
    onSelectionChangeRef.current(null);
  }, [content]);

  // ── Scale canvas to fit container ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const availW = container.clientWidth - 96;
      const availH = container.clientHeight - 96;
      const s = Math.min(availW / CANVAS_WIDTH, availH / CANVAS_HEIGHT, 1);
      setScale(Math.max(s, 0.2));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 flex items-start justify-center p-6 overflow-auto bg-neutral-100"
    >
      {/* Outer wrapper has the visual (scaled) dimensions so layout flows correctly */}
      <div
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Inner wrapper is full canvas size, scaled via CSS transform */}
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          }}
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
}
