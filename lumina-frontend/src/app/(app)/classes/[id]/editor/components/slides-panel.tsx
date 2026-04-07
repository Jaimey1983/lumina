'use client';

import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { SLIDE_LABELS } from '@/config/slide.constants';

// ─── Local slide interface (compatible with API Slide type) ───────────────────

interface SlideItem {
  id: string;
  order: number;
  type: string;
  title: string;
}

// ─── Thumbnail colors by slide type ──────────────────────────────────────────

const THUMB_BG: Record<string, string> = {
  COVER:    'bg-violet-100 dark:bg-violet-900/40',
  CONTENT:  'bg-blue-100  dark:bg-blue-900/40',
  ACTIVITY: 'bg-amber-100 dark:bg-amber-900/40',
  VIDEO:    'bg-rose-100  dark:bg-rose-900/40',
  IMAGE:    'bg-emerald-100 dark:bg-emerald-900/40',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlidesPanelProps {
  slides: SlideItem[];
  activeIndex: number;
  isLoading?: boolean;
  isAddingSlide?: boolean;
  onSelect: (index: number) => void;
  onAddSlide: () => void;
  onRemoveSlide?: (slideId: string) => void;
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
  onSelect,
  onRemoveSlide,
  onMoveSlideUp,
  onMoveSlideDown,
}: {
  slide: SlideItem;
  idx: number;
  totalSlides: number;
  activeIndex: number;
  onSelect: (idx: number) => void;
  onRemoveSlide?: (id: string) => void;
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
  const thumbBg = THUMB_BG[slide.type] ?? 'bg-muted';

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle - visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-1 top-1/2 -translate-y-1/2 z-10 size-5 cursor-grab active:cursor-grabbing',
          'flex items-center justify-center rounded',
          'bg-background/80 text-muted-foreground',
          'opacity-0 group-hover:opacity-100 transition-opacity',
        )}
      >
        <GripVertical className="size-3" />
      </div>

      <button
        type="button"
        onClick={() => onSelect(idx)}
        className={cn(
          'w-full overflow-hidden rounded-md border text-left transition-all',
          isActive
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-primary/50',
        )}
      >
        {/* Thumbnail — aspect ratio 16/9 */}
        <div
          className={cn('flex items-center justify-center', thumbBg)}
          style={{ aspectRatio: '16/9' }}
        >
          <span className="font-mono text-sm font-bold text-foreground/30">
            {slide.order}
          </span>
        </div>
        {/* Label */}
        <div className="px-2 py-1.5">
          <p className="truncate text-[10px] font-medium leading-tight">{slide.title}</p>
          <p className="text-[9px] text-muted-foreground">
            {SLIDE_LABELS[slide.type] ?? slide.type}
          </p>
        </div>
      </button>

      {onRemoveSlide && (
        <button
          type="button"
          aria-label="Eliminar slide"
          onClick={(e) => { e.stopPropagation(); onRemoveSlide(slide.id); }}
          className={cn(
            'absolute top-1 right-1 size-6 z-10',
            'flex items-center justify-center rounded',
            'bg-destructive/80 hover:bg-destructive text-white',
            'opacity-0 group-hover:opacity-100 transition-opacity',
          )}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      {(onMoveSlideUp || onMoveSlideDown) && (
        <div
          className={cn(
            'absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1 z-10',
            'opacity-0 group-hover:opacity-100 transition-opacity',
          )}
        >
          <button
            type="button"
            aria-label="Mover slide arriba"
            disabled={idx === 0}
            onClick={(e) => { e.stopPropagation(); onMoveSlideUp?.(slide.id); }}
            className={cn(
              'size-6 flex items-center justify-center rounded',
              'bg-background/90 hover:bg-accent border border-border',
              'text-muted-foreground hover:text-foreground',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Mover slide abajo"
            disabled={idx === totalSlides - 1}
            onClick={(e) => { e.stopPropagation(); onMoveSlideDown?.(slide.id); }}
            className={cn(
              'size-6 flex items-center justify-center rounded',
              'bg-background/90 hover:bg-accent border border-border',
              'text-muted-foreground hover:text-foreground',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
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
  onSelect,
  onAddSlide,
  onRemoveSlide,
  onMoveSlideUp,
  onMoveSlideDown,
  onReorderSlides,
}: SlidesPanelProps) {
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
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {slides.length}
        </span>
      </div>

      {/* Thumbnail list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
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
                  onSelect={onSelect}
                  onRemoveSlide={onRemoveSlide}
                  onMoveSlideUp={onMoveSlideUp}
                  onMoveSlideDown={onMoveSlideDown}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Agregar slide */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          disabled={isAddingSlide}
          onClick={onAddSlide}
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
      </div>

    </aside>
  );
}
