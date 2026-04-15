'use client';

import { memo, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  GitMerge,
  GripHorizontal,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  ListOrdered,
  Loader2,
  MessageSquare,
  PenLine,
  Plus,
  Shapes,
  ToggleLeft,
  Trash2,
  Type,
  Video,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { CORE_SLIDE_LAYOUTS, type CoreSlideLayoutKey } from './templates-panel';
import { LayoutThumbnail } from './layout-thumbnails';
import { SLIDE_LABELS } from '@/config/slide.constants';
import { SlideRenderer } from './slide-renderer';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';

// ─── Local slide interface (compatible with API Slide type) ───────────────────

interface SlideItem {
  id: string;
  order: number;
  type: string;
  title: string;
  content?: unknown;
}

// ─── Activity preview map ─────────────────────────────────────────────────────

const ACTIVITY_PREVIEW: Record<string, { Icon: LucideIcon; label: string }> = {
  quiz_multiple: { Icon: HelpCircle, label: 'Quiz' },
  verdadero_falso: { Icon: ToggleLeft, label: 'V/F' },
  short_answer: { Icon: MessageSquare, label: 'Respuesta' },
  completar_blancos: { Icon: PenLine, label: 'Completar' },
  arrastrar_soltar: { Icon: GripHorizontal, label: 'Arrastrar' },
  emparejar: { Icon: GitMerge, label: 'Emparejar' },
  ordenar_pasos: { Icon: ListOrdered, label: 'Ordenar' },
  video_interactivo: { Icon: Video, label: 'Video' },
  encuesta_viva: { Icon: BarChart2, label: 'Encuesta' },
  nube_palabras: { Icon: Cloud, label: 'Nube' },
};

// ─── Content helpers ──────────────────────────────────────────────────────────

function getContentRecord(content: unknown): Record<string, unknown> {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return {};
  }
  return { ...(content as Record<string, unknown>) };
}

function flattenBlocks(blocks: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const b of blocks) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    const o = b as Record<string, unknown>;
    if (o.tipo === 'columnas' && Array.isArray(o.columnas)) {
      for (const col of o.columnas as unknown[]) {
        if (Array.isArray(col)) {
          out.push(...flattenBlocks(col));
        }
      }
    } else {
      out.push(o);
    }
  }
  return out;
}

function getSlideBloques(content: unknown): Record<string, unknown>[] {
  const c = getContentRecord(content);
  const raw = c.bloques;
  return Array.isArray(raw) ? flattenBlocks(raw) : [];
}

/** `fondo` (API) o `background` si existiera. */
function getSlideFondo(content: unknown): unknown {
  const c = getContentRecord(content);
  return c.fondo ?? c.background;
}

function fondoToStyle(fondo: unknown): CSSProperties | undefined {
  if (!fondo || typeof fondo !== 'object' || Array.isArray(fondo)) return undefined;
  const f = fondo as Record<string, unknown>;
  if (f.tipo === 'color' && typeof f.valor === 'string') {
    return { backgroundColor: f.valor };
  }
  if (f.tipo === 'gradiente') {
    const start = typeof f.inicio === 'string' ? f.inicio : '#000000';
    const end = typeof f.fin === 'string' ? f.fin : '#ffffff';
    const deg = typeof f.direccion === 'number' ? f.direccion : 180;
    return { background: `linear-gradient(${deg}deg, ${start}, ${end})` };
  }
  if (f.tipo === 'imagen' && typeof f.url === 'string' && f.url.length > 0) {
    const ajuste = f.ajuste;
    let backgroundSize: string;
    if (ajuste === 'cubrir') backgroundSize = 'cover';
    else if (ajuste === 'contener') backgroundSize = 'contain';
    else backgroundSize = 'fill';
    const pos = typeof f.posicion === 'string' ? f.posicion : 'center';
    return {
      backgroundImage: `url(${f.url})`,
      backgroundSize,
      backgroundPosition: pos,
      backgroundRepeat: 'no-repeat',
    };
  }
  return undefined;
}

function stripToPlainText(htmlOrText: string): string {
  return htmlOrText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstImageBlockUrl(bloques: Record<string, unknown>[]): string | null {
  for (const b of bloques) {
    if (b.tipo !== 'imagen') continue;
    const url = typeof b.url === 'string' ? b.url : '';
    if (url.length > 0) return url;
  }
  return null;
}

function firstTextPreview(bloques: Record<string, unknown>[]): string | null {
  for (const b of bloques) {
    if (b.tipo !== 'texto') continue;
    const raw = typeof b.contenido === 'string' ? b.contenido : '';
    const plain = stripToPlainText(raw);
    if (!plain) continue;
    const lines = plain.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) return `${lines[0]}\n${lines[1]}`;
    return lines[0] ?? plain.slice(0, 80);
  }
  return null;
}

function firstActivityBlock(
  bloques: Record<string, unknown>[],
): { tipo: string } | null {
  for (const b of bloques) {
    if (b.tipo !== 'actividad') continue;
    const act = b.actividad;
    if (act && typeof act === 'object' && !Array.isArray(act) && 'tipo' in act) {
      const t = (act as { tipo?: string }).tipo;
      if (typeof t === 'string') return { tipo: t };
    }
  }
  return null;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function findVideoBlockPreview(
  slide: SlideItem,
  content: unknown,
): { hasVideo: boolean; videoUrl: string | null } {
  let hasVideo = false;

  const readFromBlocks = (blocks: unknown[]): string | null => {
    for (const b of flattenBlocks(blocks)) {
      const kind =
        typeof b.type === 'string'
          ? b.type
          : typeof b.tipo === 'string'
            ? b.tipo
            : null;
      if (kind !== 'video') continue;

      hasVideo = true;
      const candidates = [b.url, b.src, b.videoUrl, b.valor];
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
          return candidate.trim();
        }
      }
    }
    return null;
  };

  const rawSlideBlocks = (slide as { blocks?: unknown }).blocks;
  if (Array.isArray(rawSlideBlocks)) {
    const fromSlide = readFromBlocks(rawSlideBlocks);
    if (fromSlide) return { hasVideo: true, videoUrl: fromSlide };
  }

  const fromContent = readFromBlocks(getSlideBloques(content));
  if (fromContent) return { hasVideo: true, videoUrl: fromContent };

  return { hasVideo, videoUrl: null };
}

type CornerPick =
  | { kind: 'actividad'; activityType: string }
  | { kind: 'imagen' }
  | { kind: 'video' }
  | { kind: 'texto' }
  | { kind: 'forma' };

function pickCornerIconKind(bloques: Record<string, unknown>[]): CornerPick | null {
  const has = (t: string) => bloques.some((b) => b.tipo === t);
  if (has('actividad')) {
    const act = firstActivityBlock(bloques);
    return { kind: 'actividad', activityType: act?.tipo ?? '' };
  }
  if (has('imagen')) return { kind: 'imagen' };
  if (has('video')) return { kind: 'video' };
  if (has('texto')) return { kind: 'texto' };
  if (has('forma')) return { kind: 'forma' };
  return null;
}

function CornerTypeIcon({ pick }: { pick: CornerPick | null }) {
  if (!pick) return null;
  if (pick.kind === 'actividad') {
    const def = ACTIVITY_PREVIEW[pick.activityType];
    const Icon = def?.Icon ?? HelpCircle;
    return <Icon className="size-2 shrink-0 text-white drop-shadow-sm" aria-hidden />;
  }
  if (pick.kind === 'imagen') {
    return <ImageIcon className="size-2 shrink-0 text-white drop-shadow-sm" aria-hidden />;
  }
  if (pick.kind === 'video') {
    return <Video className="size-2 shrink-0 text-white drop-shadow-sm" aria-hidden />;
  }
  if (pick.kind === 'texto') {
    return <Type className="size-2 shrink-0 text-white drop-shadow-sm" aria-hidden />;
  }
  return <Shapes className="size-2 shrink-0 text-white drop-shadow-sm" aria-hidden />;
}

export interface SlideThumbnailPreviewProps {
  order: number;
  content?: unknown;
  isActive?: boolean;
  aspectRatio?: '16/9' | '4/3';
  /** Si es false, no se muestra ring (p. ej. miniatura dentro de tarjeta). */
  showOuterRing?: boolean;
  className?: string;
}

export function SlideThumbnailPreview({
  order,
  content,
  isActive = false,
  aspectRatio = '16/9',
  showOuterRing = true,
  className,
}: SlideThumbnailPreviewProps) {
  const bloques = getSlideBloques(content);
  const fondo = getSlideFondo(content);
  const bgStyle = fondoToStyle(fondo);
  const hasCustomBg = !!bgStyle;

  const imageBlockUrl = firstImageBlockUrl(bloques);
  const textPreview = firstTextPreview(bloques);
  const activity = firstActivityBlock(bloques);
  const activityDef = activity ? ACTIVITY_PREVIEW[activity.tipo] : undefined;
  const ActivityIcon = activityDef?.Icon ?? HelpCircle;
  const activityLabel = activityDef?.label ?? activity?.tipo ?? '';

  const cornerPick = pickCornerIconKind(bloques);

  let main: ReactNode;
  if (imageBlockUrl) {
    main = (
      <img
        src={imageBlockUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  } else if (textPreview) {
    main = (
      <p
        className="relative z-[1] line-clamp-2 max-w-[95%] whitespace-pre-line text-center text-[6px] leading-tight text-white drop-shadow-sm"
      >
        {textPreview}
      </p>
    );
  } else if (activity) {
    main = (
      <div className="relative z-[1] flex max-w-[95%] flex-col items-center gap-0.5 text-white drop-shadow-sm">
        <ActivityIcon className="size-3 shrink-0" aria-hidden />
        <span className="text-center text-[6px] font-medium leading-tight">{activityLabel}</span>
      </div>
    );
  } else {
    main = (
      <span className="relative z-[1] text-sm font-bold text-white/90 drop-shadow-sm tabular-nums">
        {order}
      </span>
    );
  }

  const ratio = aspectRatio === '4/3' ? '4/3' : '16/9';

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center overflow-hidden rounded-md',
        !hasCustomBg && !imageBlockUrl && 'bg-zinc-800',
        showOuterRing &&
          (isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-zinc-600 hover:ring-zinc-400'),
        className,
      )}
      style={{ aspectRatio: ratio, ...bgStyle }}
    >
      <span
        className="absolute left-0.5 top-0.5 z-[1] rounded-sm bg-black/50 px-1 text-[7px] font-medium tabular-nums text-white"
      >
        {order}
      </span>
      {imageBlockUrl ? (
        main
      ) : (
        <div className="pointer-events-none flex min-h-0 flex-1 items-center justify-center px-1 py-3">
          {main}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-0.5 right-0.5 z-[1] flex items-center justify-center">
        <CornerTypeIcon pick={cornerPick} />
      </div>
    </div>
  );
}

// ─── Canvas-based thumbnail ───────────────────────────────────────────────────

/**
 * Renders the slide using SlideRenderer so that block positions (x, y, ancho, alto)
 * are reflected immediately after drag / resize, without waiting for the
 * simplified SlideThumbnailPreview to receive a different text or image.
 *
 * `liveContent` overrides `slide.content` — used during and immediately after
 * a drag to show committed positions before the query refetch settles.
 */
export const SlideCanvasThumb = memo(function SlideCanvasThumb({
  slide,
  isActive,
  liveContent,
  className,
}: {
  slide: SlideItem;
  isActive: boolean;
  liveContent?: unknown;
  className?: string;
}) {
  const effectiveContent = liveContent ?? slide.content;
  const { hasVideo, videoUrl } = useMemo(
    () => findVideoBlockPreview(slide, effectiveContent),
    [slide, effectiveContent],
  );
  const youTubeId = videoUrl ? extractYouTubeId(videoUrl) : null;

  // Include slide.content explicitly so the thumbnail re-renders after a
  // query refetch even when only block positions (x/y/ancho/alto) changed.
  const rendererSlide = useMemo(
    () =>
      classSlideToRendererSlide({
        ...slide,
        content: effectiveContent,
      } as unknown as ApiSlide),
    [slide, effectiveContent],
  );

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-md',
        isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-zinc-600 hover:ring-zinc-400',
        className,
      )}
      style={{ aspectRatio: '16/9' }}
    >
      {hasVideo ? (
        youTubeId ? (
          <img
            src={`https://img.youtube.com/vi/${youTubeId}/0.jpg`}
            alt="preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: '#e5e7eb' }}
          >
            <Video className="size-5 text-zinc-500" aria-hidden />
          </div>
        )
      ) : (
        /* pointer-events:none so click events reach the wrapping <button> */
        <div className="pointer-events-none absolute inset-0">
          <SlideRenderer
            slide={rendererSlide}
            modo="preview"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}
      <span className="absolute left-0.5 top-0.5 z-[1] rounded-sm bg-black/50 px-1 text-[7px] font-medium tabular-nums text-white">
        {slide.order}
      </span>
    </div>
  );
});

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlidesPanelProps {
  slides: SlideItem[];
  activeIndex: number;
  isLoading?: boolean;
  isAddingSlide?: boolean;
  /** Override content for the active slide during/after drag (shows live positions). */
  activeSlideLiveContent?: unknown;
  onSelect: (index: number) => void;
  onAddSlide: (layoutKey: CoreSlideLayoutKey) => void;
  onRemoveSlide?: (slideId: string) => void;
  onDuplicateSlide?: (slideId: string) => void;
  onMoveSlideUp?: (slideId: string) => void;
  onMoveSlideDown?: (slideId: string) => void;
  onReorderSlides?: (slideId: string, newIndex: number) => void;
}

// ─── SortableSlideItem ────────────────────────────────────────────────────────

function SortableSlideItem({
  slide,
  idx,
  totalSlides,
  activeIndex,
  liveContent,
  onSelect,
  onRemoveSlide,
  onDuplicateSlide,
  onMoveSlideUp,
  onMoveSlideDown,
}: {
  slide: SlideItem;
  idx: number;
  totalSlides: number;
  activeIndex: number;
  liveContent?: unknown;
  onSelect: (idx: number) => void;
  onRemoveSlide?: (id: string) => void;
  onDuplicateSlide?: (id: string) => void;
  onMoveSlideUp?: (id: string) => void;
  onMoveSlideDown?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isActive = idx === activeIndex;

  const triggerBody = (
    <div className="relative w-full">
      {/* Drag handle - visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-1 top-1/2 z-10 size-5 -translate-y-1/2 cursor-grab',
          'flex items-center justify-center rounded active:cursor-grabbing',
          'bg-background/80 text-muted-foreground',
          'opacity-0 transition-opacity group-hover:opacity-100',
        )}
      >
        <GripVertical className="size-3" />
      </div>

      {/*
       * div instead of <button> to avoid invalid HTML (SlideRenderer renders
       * activity viewer components that contain their own <button> elements).
       */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(idx)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(idx);
          }
        }}
        className="w-full cursor-pointer overflow-hidden rounded-none border border-border text-left transition-colors hover:border-primary/40"
      >
        <SlideCanvasThumb
          slide={slide}
          isActive={isActive}
          liveContent={isActive ? liveContent : undefined}
          className="rounded-none"
        />
        {/* Label */}
        <div className="px-2 py-1.5">
          <p className="truncate text-[10px] font-medium leading-tight">{slide.title}</p>
          <p className="text-[9px] text-muted-foreground">
            {SLIDE_LABELS[slide.type] ?? slide.type}
          </p>
        </div>
      </div>

      {onRemoveSlide && (
        <button
          type="button"
          aria-label="Eliminar slide"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSlide(slide.id);
          }}
          className={cn(
            'absolute right-1 top-1 z-10 size-6',
            'flex items-center justify-center rounded',
            'bg-destructive/80 text-white hover:bg-destructive',
            'opacity-0 transition-opacity group-hover:opacity-100',
          )}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      {(onMoveSlideUp || onMoveSlideDown) && (
        <div
          className={cn(
            'absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-1',
            'opacity-0 transition-opacity group-hover:opacity-100',
          )}
        >
          <button
            type="button"
            aria-label="Mover slide arriba"
            disabled={idx === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMoveSlideUp?.(slide.id);
            }}
            className={cn(
              'flex size-6 items-center justify-center rounded border border-border',
              'bg-background/90 text-muted-foreground hover:bg-accent hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-30',
            )}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Mover slide abajo"
            disabled={idx === totalSlides - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMoveSlideDown?.(slide.id);
            }}
            className={cn(
              'flex size-6 items-center justify-center rounded border border-border',
              'bg-background/90 text-muted-foreground hover:bg-accent hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-30',
            )}
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {onDuplicateSlide ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{triggerBody}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onSelect={() => {
                onDuplicateSlide(slide.id);
              }}
            >
              <Copy className="size-4" aria-hidden />
              Duplicar slide
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        triggerBody
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlidesPanel({
  slides,
  activeIndex,
  isLoading,
  isAddingSlide,
  activeSlideLiveContent,
  onSelect,
  onAddSlide,
  onRemoveSlide,
  onDuplicateSlide,
  onMoveSlideUp,
  onMoveSlideDown,
  onReorderSlides,
}: SlidesPanelProps) {
  const [addOpen, setAddOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderSlides?.(String(active.id), newIndex);
    }
  }

  return (
    <aside className="relative z-0 flex h-full min-h-0 min-w-0 w-full shrink-0 flex-col overflow-hidden border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Slides
        </span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{slides.length}</span>
      </div>

      {/* Thumbnail list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-md" />
              ))}

            {!isLoading && slides.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">Sin slides</p>
            )}

            {!isLoading &&
              slides.map((slide, idx) => (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  idx={idx}
                  totalSlides={slides.length}
                  activeIndex={activeIndex}
                  liveContent={idx === activeIndex ? activeSlideLiveContent : undefined}
                  onSelect={onSelect}
                  onRemoveSlide={onRemoveSlide}
                  onDuplicateSlide={onDuplicateSlide}
                  onMoveSlideUp={onMoveSlideUp}
                  onMoveSlideDown={onMoveSlideDown}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Agregar slide — elige layout */}
      <div className="shrink-0 border-t border-border p-2">
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isAddingSlide}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-md border border-border',
                'bg-background py-2 text-xs font-medium text-muted-foreground',
                'transition-colors hover:border-primary/60 hover:bg-accent hover:text-primary',
                isAddingSlide && 'cursor-not-allowed opacity-50',
              )}
            >
              {isAddingSlide ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {isAddingSlide ? 'Creando…' : 'Agregar slide'}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className="w-auto p-2">
            <p className="mb-2 text-center text-[10px] font-medium text-muted-foreground">
              Layout
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CORE_SLIDE_LAYOUTS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  disabled={isAddingSlide}
                  onClick={() => {
                    onAddSlide(key);
                    setAddOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-center rounded-md border border-border bg-background p-1.5',
                    'transition-colors hover:border-primary/50 hover:bg-accent',
                    'disabled:pointer-events-none disabled:opacity-50',
                  )}
                >
                  <LayoutThumbnail layoutKey={key} compact />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
