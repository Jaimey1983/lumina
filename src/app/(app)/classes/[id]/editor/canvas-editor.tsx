'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LAYOUT_FROM_KEY, removeBlockAtPath, updateBlockAtPath } from '@/lib/class-slide-normalize';
import type { Background, Block, Layout, Slide as RendererSlide } from '@/types/slide.types';
import { cn } from '@/lib/utils';

import { SlideRenderer } from './components/slide-renderer';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Objeto que retorna `save()` para persistir en el API (bloques + metadatos de lienzo). */
export interface SlideContent {
  version: string;
  background: { type: 'color'; value: string };
  width: number;
  height: number;
  bloques: Block[];
  fondo: Background;
  diseno: Layout;
  layout?: string;
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

/** Slide activo (metadatos API) para `SlideRenderer` (id, actividades, etc.). */
export type CanvasEditorActiveSlide = Pick<RendererSlide, 'id' | 'order' | 'type' | 'title'>;

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
  /** Metadatos del slide seleccionado; si se omiten, el renderer usa valores por defecto. */
  activeSlide?: CanvasEditorActiveSlide | null;
  onSelectionChange: (props: SelectedObjectProps | null) => void;
  onReady: (api: CanvasEditorAPI) => void;
  /** Clases Tailwind del contenedor exterior del canvas (área gris + centrado). */
  wrapperClassName?: string;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  fillContainer?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const HISTORY_MAX = 50;

const DEFAULT_FONDO: Background = { tipo: 'color', valor: '#ffffff' };
const DEFAULT_DISENO: Layout = LAYOUT_FROM_KEY.titulo_y_contenido!;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface EditorDoc {
  bloques: Block[];
  fondo: Background;
  diseno: Layout;
  /** Clave `layout` persistida en el JSON de clase, si se conoce. */
  layoutKey?: string;
}

function backgroundToHex(fondo: Background): string {
  return fondo.tipo === 'color' ? fondo.valor : '#ffffff';
}

function parseEditorContent(content: unknown): EditorDoc {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return { bloques: [], fondo: DEFAULT_FONDO, diseno: DEFAULT_DISENO };
  }
  const c = content as Record<string, unknown>;

  if (Array.isArray(c.bloques)) {
    let fondo: Background = DEFAULT_FONDO;
    if (c.fondo && typeof c.fondo === 'object' && c.fondo !== null && 'tipo' in c.fondo) {
      fondo = c.fondo as Background;
    } else if (
      c.background &&
      typeof c.background === 'object' &&
      c.background !== null &&
      'value' in c.background
    ) {
      fondo = { tipo: 'color', valor: String((c.background as { value?: string }).value ?? '#ffffff') };
    }

    let layoutKey: string | undefined;
    if (typeof c.layout === 'string' && c.layout in LAYOUT_FROM_KEY) {
      layoutKey = c.layout;
    }
    let diseno: Layout = DEFAULT_DISENO;
    if (c.diseno && typeof c.diseno === 'object' && !Array.isArray(c.diseno)) {
      diseno = c.diseno as Layout;
    } else if (layoutKey) {
      diseno = LAYOUT_FROM_KEY[layoutKey]!;
    }

    let bloques = c.bloques as Block[];
    if (bloques.length === 0 && 'fabricJSON' in c && c.fabricJSON) {
      bloques = [
        {
          tipo: 'texto',
          contenido:
            'Este slide usa formato antiguo (lienzo). Edita el texto aquí o continúa en el editor de clase con bloques.',
          color: '#92400e',
          tamanoFuente: '1.125rem',
        },
      ];
    }

    return { bloques, fondo, diseno, layoutKey };
  }

  if ('fabricJSON' in c && c.fabricJSON) {
    return {
      bloques: [
        {
          tipo: 'texto',
          contenido:
            'Este slide usa formato antiguo (lienzo). Edita el texto aquí o continúa en el editor de clase con bloques.',
          color: '#92400e',
          tamanoFuente: '1.125rem',
        },
      ],
      fondo:
        c.background &&
        typeof c.background === 'object' &&
        c.background !== null &&
        'value' in c.background
          ? { tipo: 'color', valor: String((c.background as { value?: string }).value) }
          : DEFAULT_FONDO,
      diseno: DEFAULT_DISENO,
      layoutKey: typeof c.layout === 'string' && c.layout in LAYOUT_FROM_KEY ? c.layout : undefined,
    };
  }

  return { bloques: [], fondo: DEFAULT_FONDO, diseno: DEFAULT_DISENO };
}

function getBlockAtPath(bloques: Block[], path: string): Block | null {
  const parts = path.split('-').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  function go(arr: Block[], depth: number): Block | null {
    const i = parts[depth]!;
    if (i < 0 || i >= arr.length) return null;
    if (depth === parts.length - 1) return arr[i]!;

    const block = arr[i];
    if (block?.tipo !== 'columnas') return null;
    const colIdx = parts[depth + 1];
    if (colIdx === undefined || colIdx < 0 || colIdx >= block.columnas.length) return null;
    return go(block.columnas[colIdx]!, depth + 2);
  }

  return go(bloques, 0);
}

function blockToSelectedProps(block: Block): SelectedObjectProps {
  if (block.tipo === 'texto') {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fill: block.color ?? '#111827',
      stroke: '',
      strokeWidth: 0,
      opacity: 1,
      type: 'texto',
    };
  }
  if (block.tipo === 'imagen') {
    const w = block.ancho ? parseInt(String(block.ancho).replace(/\D/g, ''), 10) : 400;
    return {
      x: 0,
      y: 0,
      width: Number.isFinite(w) ? w : 400,
      height: 0,
      fill: '#e5e7eb',
      stroke: '',
      strokeWidth: 0,
      opacity: 1,
      type: 'imagen',
    };
  }
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fill: '#6366f1',
    stroke: '',
    strokeWidth: 0,
    opacity: 1,
    type: block.tipo,
  };
}

function bringIndexToEnd(arr: Block[], path: string): Block[] {
  const i = parseInt(path, 10);
  if (Number.isNaN(i) || i < 0 || i >= arr.length || !path.match(/^\d+$/)) return arr;
  const b = arr[i]!;
  return [...arr.filter((_, j) => j !== i), b];
}

function sendIndexToStart(arr: Block[], path: string): Block[] {
  const i = parseInt(path, 10);
  if (Number.isNaN(i) || i < 0 || i >= arr.length || !path.match(/^\d+$/)) return arr;
  const b = arr[i]!;
  return [b, ...arr.filter((_, j) => j !== i)];
}

function docToSlide(doc: EditorDoc, meta: CanvasEditorActiveSlide | null | undefined): RendererSlide {
  return {
    id: meta?.id ?? 'canvas-editor',
    order: meta?.order ?? 0,
    type: meta?.type ?? 'CONTENT',
    title: meta?.title ?? '',
    bloques: doc.bloques,
    fondo: doc.fondo,
    diseno: doc.diseno,
    content: null,
  };
}

function serializeDoc(doc: EditorDoc): SlideContent {
  const bg = backgroundToHex(doc.fondo);
  return {
    version: '1.0',
    background: { type: 'color', value: bg },
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    bloques: doc.bloques,
    fondo: doc.fondo,
    diseno: doc.diseno,
    layout: doc.layoutKey ?? 'titulo_y_contenido',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CanvasEditor({
  content,
  activeSlide = null,
  onSelectionChange,
  onReady,
  wrapperClassName,
  onHistoryChange,
  fillContainer = true,
}: CanvasEditorProps) {
  const [doc, setDoc] = useState<EditorDoc>(() => parseEditorContent(content));
  const [scale, setScale] = useState(0.65);
  const [rendererEpoch, setRendererEpoch] = useState(0);

  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const selectedPathRef = useRef<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  useEffect(() => {
    selectedPathRef.current = selectedPath;
  }, [selectedPath]);

  const isRestoringRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSelectionChangeRef = useRef(onSelectionChange);
  const onReadyRef = useRef(onReady);
  const onHistoryChangeRef = useRef(onHistoryChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onHistoryChangeRef.current = onHistoryChange;
  }, [onHistoryChange]);

  const commitDoc = useCallback((next: EditorDoc) => {
    docRef.current = next;
    setDoc(next);
  }, []);

  const emitHistory = useCallback(() => {
    const h = historyRef.current;
    const i = historyIndexRef.current;
    onHistoryChangeRef.current?.({
      canUndo: i > 0,
      canRedo: i < h.length - 1,
    });
  }, []);

  const pushHistorySnapshot = useCallback(() => {
    if (isRestoringRef.current) return;
    const json = JSON.stringify(docRef.current);
    const h = historyRef.current;
    h.splice(historyIndexRef.current + 1);
    h.push(json);
    historyIndexRef.current = h.length - 1;
    while (h.length > HISTORY_MAX) {
      h.shift();
      historyIndexRef.current--;
    }
    emitHistory();
  }, [emitHistory]);

  const scheduleHistorySnapshot = useCallback(() => {
    if (isRestoringRef.current) return;
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      historyDebounceRef.current = null;
      pushHistorySnapshot();
    }, 280);
  }, [pushHistorySnapshot]);

  const resetHistoryFromDoc = useCallback(() => {
    const json = JSON.stringify(docRef.current);
    historyRef.current = [json];
    historyIndexRef.current = 0;
    emitHistory();
  }, [emitHistory]);

  // Cargar contenido del slide seleccionado
  useEffect(() => {
    isRestoringRef.current = true;
    const next = parseEditorContent(content);
    docRef.current = next;
    setDoc(next);
    selectedPathRef.current = null;
    setSelectedPath(null);
    onSelectionChangeRef.current(null);
    setRendererEpoch((e) => e + 1);
    isRestoringRef.current = false;
    resetHistoryFromDoc();
  }, [content, resetHistoryFromDoc]);

  const handleBlockSelect = useCallback(
    (blockId: string) => {
      selectedPathRef.current = blockId;
      setSelectedPath(blockId);
      const b = getBlockAtPath(docRef.current.bloques, blockId);
      onSelectionChangeRef.current(b ? blockToSelectedProps(b) : null);
    },
    [],
  );

  useEffect(() => {
    if (!selectedPath) return;
    const b = getBlockAtPath(doc.bloques, selectedPath);
    onSelectionChangeRef.current(b ? blockToSelectedProps(b) : null);
  }, [doc.bloques, selectedPath]);

  const slideForRenderer = useMemo(() => docToSlide(doc, activeSlide), [doc, activeSlide]);

  useEffect(() => {
    const api: CanvasEditorAPI = {
      save: () => serializeDoc(docRef.current),

      addText: () => {
        const block: Block = {
          tipo: 'texto',
          contenido: 'Texto nuevo',
          tamanoFuente: '1.5rem',
          color: '#111827',
        };
        commitDoc({ ...docRef.current, bloques: [...docRef.current.bloques, block] });
        scheduleHistorySnapshot();
      },

      addImage: (url: string) => {
        const block: Block = {
          tipo: 'imagen',
          url: url.trim() || 'https://placehold.co/400x300/png?text=Imagen',
          ancho: 'min(100%, 480px)',
        };
        commitDoc({ ...docRef.current, bloques: [...docRef.current.bloques, block] });
        scheduleHistorySnapshot();
      },

      addRect: () => {
        const block: Block = {
          tipo: 'texto',
          contenido: 'Bloque tipo rectángulo (usa color de relleno en propiedades)',
          tamanoFuente: '1.125rem',
          color: '#4f46e5',
          negrita: true,
        };
        commitDoc({ ...docRef.current, bloques: [...docRef.current.bloques, block] });
        scheduleHistorySnapshot();
      },

      addCircle: () => {
        const block: Block = {
          tipo: 'texto',
          contenido: '● Bloque circular (edita color en propiedades)',
          tamanoFuente: '1.25rem',
          color: '#0ea5e9',
          negrita: true,
        };
        commitDoc({ ...docRef.current, bloques: [...docRef.current.bloques, block] });
        scheduleHistorySnapshot();
      },

      addButton: () => {
        const block: Block = {
          tipo: 'texto',
          contenido: 'Botón / llamada a la acción',
          tamanoFuente: '1.125rem',
          color: '#ffffff',
          negrita: true,
          alineacion: 'centro',
        };
        commitDoc({ ...docRef.current, bloques: [...docRef.current.bloques, block] });
        scheduleHistorySnapshot();
      },

      deleteSelected: () => {
        const path = selectedPathRef.current;
        if (!path) return;
        const next = { ...docRef.current, bloques: removeBlockAtPath(docRef.current.bloques, path) };
        commitDoc(next);
        selectedPathRef.current = null;
        setSelectedPath(null);
        onSelectionChangeRef.current(null);
        pushHistorySnapshot();
      },

      bringToFront: () => {
        const path = selectedPathRef.current;
        if (!path || !path.match(/^\d+$/)) return;
        const next = { ...docRef.current, bloques: bringIndexToEnd(docRef.current.bloques, path) };
        const newIdx = next.bloques.length - 1;
        const newPath = String(newIdx);
        commitDoc(next);
        selectedPathRef.current = newPath;
        setSelectedPath(newPath);
        const b = getBlockAtPath(next.bloques, newPath);
        onSelectionChangeRef.current(b ? blockToSelectedProps(b) : null);
        pushHistorySnapshot();
      },

      sendToBack: () => {
        const path = selectedPathRef.current;
        if (!path || !path.match(/^\d+$/)) return;
        const next = { ...docRef.current, bloques: sendIndexToStart(docRef.current.bloques, path) };
        commitDoc(next);
        selectedPathRef.current = '0';
        setSelectedPath('0');
        const b = getBlockAtPath(next.bloques, '0');
        onSelectionChangeRef.current(b ? blockToSelectedProps(b) : null);
        pushHistorySnapshot();
      },

      undo: () => {
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        isRestoringRef.current = true;
        const raw = historyRef.current[historyIndexRef.current];
        const parsed = JSON.parse(raw) as EditorDoc;
        docRef.current = parsed;
        setDoc(parsed);
        selectedPathRef.current = null;
        setSelectedPath(null);
        onSelectionChangeRef.current(null);
        setRendererEpoch((e) => e + 1);
        isRestoringRef.current = false;
        emitHistory();
      },

      redo: () => {
        const h = historyRef.current;
        if (historyIndexRef.current >= h.length - 1) return;
        historyIndexRef.current++;
        isRestoringRef.current = true;
        const parsed = JSON.parse(h[historyIndexRef.current]) as EditorDoc;
        docRef.current = parsed;
        setDoc(parsed);
        selectedPathRef.current = null;
        setSelectedPath(null);
        onSelectionChangeRef.current(null);
        setRendererEpoch((e) => e + 1);
        isRestoringRef.current = false;
        emitHistory();
      },

      setProperty: (key: string, value: unknown) => {
        const path = selectedPathRef.current;
        if (!path) return;
        const current = docRef.current;
        const block = getBlockAtPath(current.bloques, path);
        if (!block) return;

        if (block.tipo === 'texto') {
          if (key === 'fill') {
            const bloques = updateBlockAtPath(current.bloques, path, (b) =>
              b.tipo === 'texto' ? { ...b, color: String(value) } : b,
            );
            const next = { ...current, bloques };
            commitDoc(next);
            onSelectionChangeRef.current(blockToSelectedProps(getBlockAtPath(bloques, path)!));
            scheduleHistorySnapshot();
          }
          return;
        }
      },

      setBackground: (color: string) => {
        const next = {
          ...docRef.current,
          fondo: { tipo: 'color' as const, valor: color },
        };
        commitDoc(next);
        pushHistorySnapshot();
      },
    };

    onReadyRef.current(api);
    // setState de React es estable; el API es imperativo y lee siempre docRef/history refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- API del lienzo: una sola instancia expuesta al padre
  }, []);

  useEffect(() => {
    return () => {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

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
      <div
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          position: 'relative',
          flexShrink: 0,
        }}
      >
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
          <div className="relative h-full w-full overflow-hidden rounded-sm border border-border bg-card">
            <SlideRenderer
              key={rendererEpoch}
              slide={slideForRenderer}
              modo="editor"
              onBlockSelect={handleBlockSelect}
              onRemoveBlock={(blockId) => {
                const next = { ...docRef.current, bloques: removeBlockAtPath(docRef.current.bloques, blockId) };
                commitDoc(next);
                if (selectedPathRef.current === blockId) {
                  selectedPathRef.current = null;
                  setSelectedPath(null);
                  onSelectionChangeRef.current(null);
                }
                pushHistorySnapshot();
              }}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
