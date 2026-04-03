'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { cn } from '@/lib/utils';

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
  undo: () => void;
  redo: () => void;
}

interface CanvasEditorProps {
  content: unknown;
  onSelectionChange: (props: SelectedObjectProps | null) => void;
  onReady: (api: CanvasEditorAPI) => void;
  /** Clases Tailwind del contenedor exterior del canvas (área gris + centrado). */
  wrapperClassName?: string;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  /**
   * Si true (defecto), el lienzo llena el contenedor padre (h-full + overflow-hidden)
   * y la escala se calcula para caber sin desbordar el viewport.
   */
  fillContainer?: boolean;
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

const HISTORY_MAX = 50;

export default function CanvasEditor({
  content,
  onSelectionChange,
  onReady,
  wrapperClassName,
  onHistoryChange,
  fillContainer = true,
}: CanvasEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);

  const isRestoringRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callbacks in refs to avoid stale closures
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onReadyRef = useRef(onReady);
  const onHistoryChangeRef = useRef(onHistoryChange);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onHistoryChangeRef.current = onHistoryChange; }, [onHistoryChange]);

  const emitHistory = () => {
    const h = historyRef.current;
    const i = historyIndexRef.current;
    onHistoryChangeRef.current?.({
      canUndo: i > 0,
      canRedo: i < h.length - 1,
    });
  };

  const pushHistorySnapshot = () => {
    const canvas = fabricRef.current;
    if (!canvas || isRestoringRef.current) return;
    const json = JSON.stringify(canvas.toJSON(['data']));
    const h = historyRef.current;
    h.splice(historyIndexRef.current + 1);
    h.push(json);
    historyIndexRef.current = h.length - 1;
    while (h.length > HISTORY_MAX) {
      h.shift();
      historyIndexRef.current--;
    }
    emitHistory();
  };

  const scheduleHistorySnapshot = () => {
    if (isRestoringRef.current) return;
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      historyDebounceRef.current = null;
      pushHistorySnapshot();
    }, 280);
  };

  const resetHistoryFromCanvas = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON(['data']));
    historyRef.current = [json];
    historyIndexRef.current = 0;
    emitHistory();
  };

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

    canvas.on('object:added', scheduleHistorySnapshot);
    canvas.on('object:removed', scheduleHistorySnapshot);
    canvas.on('object:modified', scheduleHistorySnapshot);

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
          pushHistorySnapshot();
        }
      },
      sendToBack: () => {
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.sendToBack(obj);
          canvas.renderAll();
          pushHistorySnapshot();
        }
      },
      undo: () => {
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        isRestoringRef.current = true;
        const raw = historyRef.current[historyIndexRef.current];
        canvas.loadFromJSON(JSON.parse(raw), () => {
          canvas.renderAll();
          isRestoringRef.current = false;
          const obj = canvas.getActiveObject();
          onSelectionChangeRef.current(obj ? extractProps(obj) : null);
          emitHistory();
        });
      },
      redo: () => {
        const h = historyRef.current;
        if (historyIndexRef.current >= h.length - 1) return;
        historyIndexRef.current++;
        isRestoringRef.current = true;
        canvas.loadFromJSON(JSON.parse(h[historyIndexRef.current]), () => {
          canvas.renderAll();
          isRestoringRef.current = false;
          const obj = canvas.getActiveObject();
          onSelectionChangeRef.current(obj ? extractProps(obj) : null);
          emitHistory();
        });
      },
      setProperty: (key: string, value: unknown) => {
        const obj = canvas.getActiveObject();
        if (!obj) return;
        obj.set(key as keyof fabric.Object, value as never);
        canvas.requestRenderAll();
        onSelectionChangeRef.current(extractProps(obj));
      },
      setBackground: (color: string) => {
        canvas.setBackgroundColor(color, () => {
          canvas.renderAll();
          pushHistorySnapshot();
        });
      },
    };

    onReadyRef.current(api);

    return () => {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init Fabric una vez; handlers usan refs
  }, []);

  // ── Load slide content when it changes ─────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    isRestoringRef.current = true;

    const bg = isFabricJSON(content)
      ? ((content as { background?: { value?: string } }).background?.value ?? '#ffffff')
      : '#ffffff';

    const afterLoad = () => {
      canvas.discardActiveObject();
      onSelectionChangeRef.current(null);
      isRestoringRef.current = false;
      resetHistoryFromCanvas();
    };

    if (isFabricJSON(content)) {
      canvas.loadFromJSON(content.fabricJSON, () => {
        canvas.setBackgroundColor(bg, () => {
          canvas.renderAll();
          afterLoad();
        });
      });
    } else {
      canvas.clear();
      canvas.setBackgroundColor(bg, () => {
        canvas.renderAll();
        afterLoad();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar slide (content)
  }, [content]);

  // ── Scale canvas to fit container ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pad = fillContainer ? 8 : 32;
    const observer = new ResizeObserver(() => {
      const availW = Math.max(container.clientWidth - pad, 40);
      const availH = Math.max(container.clientHeight - pad, 40);
      const s = Math.min(availW / CANVAS_WIDTH, availH / CANVAS_HEIGHT, 1);
      setScale(Math.max(s, 0.15));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [fillContainer]);

  return (
    <div
      ref={containerRef}
      className={cn(
        fillContainer
          ? 'flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center overflow-hidden bg-neutral-100'
          : 'flex min-h-0 flex-1 items-start justify-center overflow-auto bg-neutral-100 p-6',
        wrapperClassName,
      )}
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
