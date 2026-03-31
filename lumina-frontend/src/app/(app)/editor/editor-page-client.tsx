'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  BringToFront,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  ImageIcon,
  ListOrdered,
  MousePointerClick,
  Plus,
  Redo2,
  Save,
  SendToBack,
  Square,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';

import { useCourses } from '@/hooks/api/use-courses';
import { useCourse } from '@/hooks/api/use-course';
import { useClasses } from '@/hooks/api/use-classes';
import { useClass } from '@/hooks/api/use-class';
import { useCreateSlide, useUpdateSlide, type CreateSlideInput } from '@/hooks/api/use-classes';
import type { CanvasEditorAPI, SelectedObjectProps, SlideContent } from '@/app/(app)/classes/[id]/editor/canvas-editor';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const CanvasEditor = dynamic(() => import('@/app/(app)/classes/[id]/editor/canvas-editor'), {
  ssr: false,
});
const SlidePreviewCanvas = dynamic(() => import('@/app/(app)/classes/[id]/editor/slide-preview'), {
  ssr: false,
});

const SLIDE_TYPES = ['COVER', 'CONTENT', 'ACTIVITY', 'VIDEO', 'IMAGE'] as const;

const SLIDE_LABELS: Record<string, string> = {
  COVER: 'Portada',
  CONTENT: 'Contenido',
  ACTIVITY: 'Actividad',
  VIDEO: 'Video',
  IMAGE: 'Imagen',
};

const SLIDE_BG: Record<string, string> = {
  COVER: 'bg-violet-500',
  CONTENT: 'bg-blue-500',
  ACTIVITY: 'bg-amber-500',
  VIDEO: 'bg-rose-500',
  IMAGE: 'bg-emerald-500',
};

const slideSchema = z.object({
  type: z.enum(['COVER', 'CONTENT', 'ACTIVITY', 'VIDEO', 'IMAGE']),
  title: z.string().min(1, 'El título es obligatorio'),
});
type SlideFormData = z.infer<typeof slideSchema>;

type Slide = NonNullable<NonNullable<ReturnType<typeof useClass>['data']>['slides']>[number];

function AddSlideModal({
  classId,
  open,
  onOpenChange,
  onCreated,
}: {
  classId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const createSlide = useCreateSlide(classId);
  const form = useForm<SlideFormData>({
    resolver: zodResolver(slideSchema),
    defaultValues: { type: 'CONTENT', title: '' },
  });

  function onSubmit(data: SlideFormData) {
    const input: CreateSlideInput = { type: data.type, title: data.title };
    createSlide.mutate(input, {
      onSuccess: (created) => {
        toast.success('Slide creado');
        form.reset();
        onOpenChange(false);
        if (created && typeof created === 'object' && 'id' in created && typeof (created as { id: string }).id === 'string') {
          onCreated?.((created as { id: string }).id);
        }
      },
      onError: () => toast.error('Error al crear el slide'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo slide</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground"
                        {...field}
                      >
                        {SLIDE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {SLIDE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del slide" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSlide.isPending}>
                {createSlide.isPending ? 'Creando…' : 'Crear slide'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SlidePreviewModal({
  slides,
  startIndex,
  onClose,
}: {
  slides: Slide[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const prev = () => setCurrent((i) => Math.max(i - 1, 0));
  const next = () => setCurrent((i) => Math.min(i + 1, slides.length - 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps -- prev/next stable via setState

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar vista previa"
      >
        <X className="size-6" />
      </button>
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
        {slide?.title}
      </p>
      <div className="flex items-center justify-center w-full px-20">
        <SlidePreviewCanvas
          content={slide?.content}
          displayWidth={typeof window !== 'undefined' ? Math.min(window.innerWidth - 160, 1280) : 960}
        />
      </div>
      <div className="absolute bottom-6 flex items-center gap-6">
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className="text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Slide anterior"
        >
          <ArrowLeft className="size-8" />
        </button>
        <span className="text-white/70 text-sm tabular-nums">
          {current + 1} / {slides.length}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={current === slides.length - 1}
          className="text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Slide siguiente"
        >
          <ArrowRight className="size-8" />
        </button>
      </div>
    </div>
  );
}

function PropertiesPanel({
  selected,
  onChangeProp,
}: {
  selected: SelectedObjectProps | null;
  onChangeProp: (key: string, value: unknown) => void;
}) {
  if (!selected) return null;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{selected.type}</p>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Posición</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">X</label>
            <Input
              type="number"
              value={selected.x}
              onChange={(e) => onChangeProp('left', Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Y</label>
            <Input
              type="number"
              value={selected.y}
              onChange={(e) => onChangeProp('top', Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Tamaño</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Ancho</label>
            <Input type="number" value={selected.width} readOnly className="h-7 text-xs opacity-60" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Alto</label>
            <Input type="number" value={selected.height} readOnly className="h-7 text-xs opacity-60" />
          </div>
        </div>
      </div>
      {selected.fill && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Color de relleno</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selected.fill.startsWith('#') ? selected.fill : '#000000'}
              onChange={(e) => onChangeProp('fill', e.target.value)}
              className="size-7 rounded border border-input cursor-pointer p-0.5"
            />
            <Input
              value={selected.fill}
              onChange={(e) => onChangeProp('fill', e.target.value)}
              className="h-7 text-xs font-mono flex-1"
            />
          </div>
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Color de borde</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selected.stroke && selected.stroke.startsWith('#') ? selected.stroke : '#000000'}
            onChange={(e) => onChangeProp('stroke', e.target.value)}
            className="size-7 rounded border border-input cursor-pointer p-0.5"
          />
          <Input
            value={selected.stroke}
            onChange={(e) => onChangeProp('stroke', e.target.value)}
            className="h-7 text-xs font-mono flex-1"
            placeholder="sin borde"
          />
        </div>
        <div className="mt-2">
          <label className="text-[10px] text-muted-foreground">Grosor</label>
          <Input
            type="number"
            min={0}
            max={20}
            value={selected.strokeWidth}
            onChange={(e) => onChangeProp('strokeWidth', Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">
          Opacidad — {Math.round(selected.opacity * 100)}%
        </p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={selected.opacity}
          onChange={(e) => onChangeProp('opacity', Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}

function ImageUrlOverlay({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState('');
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-xl p-6 w-96 space-y-4">
        <p className="font-semibold">Agregar imagen por URL</p>
        <Input
          autoFocus
          placeholder="https://example.com/image.png"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onConfirm(url);
              setUrl('');
            }
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onConfirm(url);
              setUrl('');
            }}
            disabled={!url.trim()}
          >
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

function FloatingToolbar({
  onAddText,
  onAddImage,
  onAddRect,
  onAddCircle,
  onAddButton,
  onDelete,
  onBringToFront,
  onSendToBack,
  onUndo,
  onRedo,
  hasSelection,
  canUndo,
  canRedo,
}: {
  onAddText: () => void;
  onAddImage: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddButton: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
}) {
  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
      <Button size="icon" variant="ghost" title="Texto" onClick={onAddText} className="size-8">
        <Type className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Imagen (URL)" onClick={onAddImage} className="size-8">
        <ImageIcon className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Rectángulo" onClick={onAddRect} className="size-8">
        <Square className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Círculo" onClick={onAddCircle} className="size-8">
        <Circle className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Botón interactivo" onClick={onAddButton} className="size-8">
        <MousePointerClick className="size-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button
        size="icon"
        variant="ghost"
        title="Deshacer"
        onClick={onUndo}
        disabled={!canUndo}
        className="size-8"
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        title="Rehacer"
        onClick={onRedo}
        disabled={!canRedo}
        className="size-8"
      >
        <Redo2 className="size-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button
        size="icon"
        variant="ghost"
        title="Traer al frente"
        onClick={onBringToFront}
        disabled={!hasSelection}
        className="size-8"
      >
        <BringToFront className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        title="Enviar al fondo"
        onClick={onSendToBack}
        disabled={!hasSelection}
        className="size-8"
      >
        <SendToBack className="size-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button
        size="icon"
        variant="ghost"
        title="Eliminar"
        onClick={onDelete}
        disabled={!hasSelection}
        className="size-8 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function EditorWorkspace({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  const { data: course } = useCourse(cls?.courseId ?? '');
  const updateSlide = useUpdateSlide(classId);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [slidePick, setSlidePick] = useState<string | null>(null);
  const [selectedProps, setSelectedProps] = useState<SelectedObjectProps | null>(null);
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveUi, setSaveUi] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [historyUi, setHistoryUi] = useState({ canUndo: false, canRedo: false });

  const apiRef = useRef<CanvasEditorAPI | null>(null);
  const selectedSlideIdRef = useRef<string | null>(null);

  const slides = cls?.slides;
  const sortedSlides = useMemo(() => {
    if (!slides?.length) return [];
    return [...slides].sort((a, b) => a.order - b.order);
  }, [slides]);

  const selectedSlideId = useMemo(() => {
    if (sortedSlides.length === 0) return null;
    if (slidePick && sortedSlides.some((s) => s.id === slidePick)) return slidePick;
    return sortedSlides[0]!.id;
  }, [sortedSlides, slidePick]);

  useEffect(() => {
    selectedSlideIdRef.current = selectedSlideId;
  }, [selectedSlideId]);

  const selectedSlide = cls?.slides?.find((s) => s.id === selectedSlideId);

  const handleSave = useCallback(
    (silent = false) => {
      const slideId = selectedSlideIdRef.current;
      if (!apiRef.current || !slideId) return;

      const content: SlideContent = apiRef.current.save();
      setIsSaving(true);
      setSaveUi('saving');
      updateSlide.mutate(
        { slideId, content },
        {
          onSuccess: () => {
            if (!silent) toast.success('Slide guardado');
            setIsSaving(false);
            setSaveUi('saved');
            window.setTimeout(() => setSaveUi('idle'), 2200);
          },
          onError: () => {
            if (!silent) toast.error('Error al guardar el slide');
            setIsSaving(false);
            setSaveUi('idle');
          },
        },
      );
    },
    [updateSlide],
  );

  useEffect(() => {
    const t = window.setInterval(() => handleSave(true), 30_000);
    return () => clearInterval(t);
  }, [handleSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const previewStartIndex = Math.max(sortedSlides.findIndex((s) => s.id === selectedSlideId), 0);

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-destructive">No se pudo cargar la clase.</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Sidebar 240px / 48px ── */}
        <aside
          className={cn(
            'flex shrink-0 flex-col overflow-hidden border-r border-border bg-muted/20 transition-[width] duration-200',
            sidebarExpanded ? 'w-[240px]' : 'w-[48px]',
          )}
        >
          <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0"
              aria-label={sidebarExpanded ? 'Contraer barra lateral' : 'Expandir barra lateral'}
              aria-expanded={sidebarExpanded}
              onClick={() => setSidebarExpanded((v) => !v)}
            >
              {sidebarExpanded ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
            </Button>
            {sidebarExpanded && (
              <div className="min-w-0 flex-1 pr-1">
                {isLoading ? (
                  <Skeleton className="h-3 w-24" />
                ) : (
                  <>
                    <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {course?.name ?? 'Curso'}
                    </p>
                    <p className="truncate text-xs font-semibold leading-tight">{cls?.title ?? '—'}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {sidebarExpanded && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <ListOrdered className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Slides
              </span>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {sidebarExpanded ? (
              <div className="space-y-2 px-2">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
                {sortedSlides.map((slide) => {
                  const active = slide.id === selectedSlideId;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSlidePick(slide.id)}
                      className={cn(
                        'w-full overflow-hidden rounded-lg border text-left transition-all',
                        active ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                      )}
                    >
                      <div className="bg-muted/50 flex justify-center overflow-hidden">
                        <SlidePreviewCanvas content={slide.content} displayWidth={120} />
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-medium">
                          <span className="text-muted-foreground">#{slide.order}</span> {slide.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {SLIDE_LABELS[slide.type] ?? slide.type}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {!isLoading && sortedSlides.length === 0 && (
                  <p className="px-2 text-center text-xs text-muted-foreground">Sin slides. Pulsa + para crear.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 px-1">
                {sortedSlides.map((slide) => {
                  const bgColor = SLIDE_BG[slide.type] ?? 'bg-muted';
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      title={slide.title}
                      onClick={() => setSlidePick(slide.id)}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md text-[10px] font-bold text-white',
                        bgColor,
                        slide.id === selectedSlideId ? 'ring-2 ring-primary ring-offset-2' : '',
                      )}
                    >
                      {slide.order}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={cn(
              'mt-auto flex flex-col gap-1 border-t border-border p-2',
              !sidebarExpanded && 'items-center',
            )}
          >
            <Button
              type="button"
              variant={sidebarExpanded ? 'outline' : 'ghost'}
              size={sidebarExpanded ? 'sm' : 'icon'}
              className={cn(!sidebarExpanded && 'size-9')}
              title="Nuevo slide"
              onClick={() => setShowAddSlide(true)}
            >
              <Plus className="size-4" />
              {sidebarExpanded && <span className="ml-1.5">Agregar slide</span>}
            </Button>
            <Button
              type="button"
              variant={sidebarExpanded ? 'primary' : 'ghost'}
              size={sidebarExpanded ? 'sm' : 'icon'}
              className={cn(!sidebarExpanded && 'size-9')}
              title={
                saveUi === 'saving'
                  ? 'Guardando…'
                  : saveUi === 'saved'
                    ? 'Guardado'
                    : 'Guardar (Ctrl+S)'
              }
              disabled={isSaving || !selectedSlideId}
              onClick={() => handleSave(false)}
            >
              <Save className="size-4" />
              {sidebarExpanded && <span className="ml-1.5">{isSaving ? 'Guardando…' : 'Guardar'}</span>}
            </Button>
            <Button
              type="button"
              variant={sidebarExpanded ? 'outline' : 'ghost'}
              size={sidebarExpanded ? 'sm' : 'icon'}
              className={cn(!sidebarExpanded && 'size-9')}
              title="Vista previa"
              disabled={sortedSlides.length === 0}
              onClick={() => setShowPreview(true)}
            >
              <Eye className="size-4" />
              {sidebarExpanded && <span className="ml-1.5">Vista previa</span>}
            </Button>
            {sidebarExpanded ? (
              <Button type="button" variant="ghost" size="sm" className="justify-start" asChild>
                <Link href="/classes">
                  <ArrowLeft className="size-4" />
                  Salir
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="icon" className="size-9" title="Salir" asChild>
                <Link href="/classes">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            )}
            {sidebarExpanded && (
              <p className="text-center text-[10px] text-muted-foreground">
                {saveUi === 'saving' && 'Guardando…'}
                {saveUi === 'saved' && 'Guardado'}
                {saveUi === 'idle' && !isSaving && ' '}
              </p>
            )}
          </div>
        </aside>

        {/* ── Canvas + toolbar flotante ── */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <FloatingToolbar
            onAddText={() => apiRef.current?.addText()}
            onAddImage={() => setShowImageOverlay(true)}
            onAddRect={() => apiRef.current?.addRect()}
            onAddCircle={() => apiRef.current?.addCircle()}
            onAddButton={() => apiRef.current?.addButton()}
            onDelete={() => apiRef.current?.deleteSelected()}
            onBringToFront={() => apiRef.current?.bringToFront()}
            onSendToBack={() => apiRef.current?.sendToBack()}
            onUndo={() => apiRef.current?.undo()}
            onRedo={() => apiRef.current?.redo()}
            hasSelection={!!selectedProps}
            canUndo={historyUi.canUndo}
            canRedo={historyUi.canRedo}
          />

          <CanvasEditor
            content={selectedSlide?.content ?? null}
            onSelectionChange={setSelectedProps}
            onReady={(api) => {
              apiRef.current = api;
            }}
            fillContainer
            wrapperClassName="min-h-0 p-2 pt-14"
            onHistoryChange={setHistoryUi}
          />

          <ImageUrlOverlay
            open={showImageOverlay}
            onConfirm={(url) => {
              apiRef.current?.addImage(url);
              setShowImageOverlay(false);
            }}
            onCancel={() => setShowImageOverlay(false)}
          />
        </div>

        {/* ── Properties ── */}
        {selectedProps ? (
          <aside className="flex w-64 shrink-0 flex-col border-l border-border bg-background overflow-hidden">
            <div className="border-b border-border px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Propiedades
              </span>
            </div>
            <PropertiesPanel
              selected={selectedProps}
              onChangeProp={(key, value) => apiRef.current?.setProperty(key, value)}
            />
          </aside>
        ) : null}
      </div>

      <AddSlideModal
        classId={classId}
        open={showAddSlide}
        onOpenChange={setShowAddSlide}
        onCreated={(id) => setSlidePick(id)}
      />

      {showPreview && sortedSlides.length > 0 && (
        <SlidePreviewModal
          slides={sortedSlides}
          startIndex={previewStartIndex}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function SelectionView({
  onOpen,
}: {
  onOpen: (classId: string) => void;
}) {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const [coursePick, setCoursePick] = useState<string | null>(null);
  const selectedCourseId = coursePick ?? courses[0]?.id ?? '';
  const { data: classes = [], isLoading: classesLoading } = useClasses(selectedCourseId);
  const [classPick, setClassPick] = useState<string>('');

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-neutral-200/80 p-4 dark:bg-neutral-950/50">
      <div className="w-full max-w-[400px] space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Editor de slides</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Elige curso y clase para abrir el lienzo de edición.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ed-course" className="text-xs font-medium">
            Curso
          </label>
          {coursesLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay cursos.</p>
          ) : (
            <select
              id="ed-course"
              value={selectedCourseId}
              onChange={(e) => {
                setCoursePick(e.target.value);
                setClassPick('');
              }}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ed-class" className="text-xs font-medium">
            Clase
          </label>
          {!selectedCourseId ? (
            <p className="text-sm text-muted-foreground">Selecciona un curso primero.</p>
          ) : classesLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay clases en este curso.</p>
          ) : (
            <select
              id="ed-class"
              value={classPick}
              onChange={(e) => setClassPick(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecciona una clase</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <Button className="mt-1 w-full" size="sm" disabled={!classPick} onClick={() => onOpen(classPick)}>
          Abrir editor
        </Button>
        <Button variant="ghost" className="w-full" size="sm" asChild>
          <Link href="/classes">Volver a clases</Link>
        </Button>
      </div>
    </div>
  );
}

export function EditorPageClient() {
  const [sessionClassId, setSessionClassId] = useState<string | null>(null);

  if (!sessionClassId) {
    return <SelectionView onOpen={setSessionClassId} />;
  }

  return <EditorWorkspace classId={sessionClassId} />;
}
