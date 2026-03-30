'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRight,
  BringToFront,
  Circle,
  Eye,
  ImageIcon,
  MousePointerClick,
  Plus,
  Save,
  SendToBack,
  Square,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useClass } from '@/hooks/api/use-class';
import { useCreateSlide, useUpdateSlide, type CreateSlideInput } from '@/hooks/api/use-classes';
import type { CanvasEditorAPI, SelectedObjectProps, SlideContent } from './canvas-editor';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

// Canvas and preview loaded client-side only — Fabric.js is browser-only
const CanvasEditor = dynamic(() => import('./canvas-editor'), { ssr: false });
const SlidePreviewCanvas = dynamic(() => import('./slide-preview'), { ssr: false });

// ─── Slide labels / colors ────────────────────────────────────────────────────

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

// ─── Add Slide Modal ──────────────────────────────────────────────────────────

const slideSchema = z.object({
  type: z.enum(['COVER', 'CONTENT', 'ACTIVITY', 'VIDEO', 'IMAGE']),
  title: z.string().min(1, 'El título es obligatorio'),
});
type SlideFormData = z.infer<typeof slideSchema>;

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
        if (created?.id) onCreated?.(created.id);
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

// ─── Slide Preview Modal (fullscreen presentation) ────────────────────────────

type Slide = NonNullable<NonNullable<ReturnType<typeof useClass>['data']>['slides']>[number];

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

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar vista previa"
      >
        <X className="size-6" />
      </button>

      {/* Slide title */}
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
        {slide?.title}
      </p>

      {/* Canvas */}
      <div className="flex items-center justify-center w-full px-20">
        <SlidePreviewCanvas
          content={slide?.content}
          displayWidth={Math.min(window.innerWidth - 160, 1280)}
        />
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-6 flex items-center gap-6">
        <button
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

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({
  selected,
  onChangeProp,
}: {
  selected: SelectedObjectProps | null;
  onChangeProp: (key: string, value: unknown) => void;
}) {
  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
          <MousePointerClick className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Selecciona un elemento para ver sus propiedades
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {selected.type}
      </p>

      {/* Position */}
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

      {/* Size (read-only) */}
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

      {/* Fill */}
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

      {/* Stroke */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Color de borde</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={
              selected.stroke && selected.stroke.startsWith('#') ? selected.stroke : '#000000'
            }
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

      {/* Opacity */}
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

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddButton: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  hasSelection: boolean;
}

function EditorToolbar({
  onAddText,
  onAddImage,
  onAddRect,
  onAddCircle,
  onAddButton,
  onDelete,
  onBringToFront,
  onSendToBack,
  hasSelection,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 h-10 border-b border-border bg-background">
      <Button size="icon" variant="ghost" title="Agregar texto" onClick={onAddText} className="size-8">
        <Type className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        title="Agregar imagen (URL)"
        onClick={onAddImage}
        className="size-8"
      >
        <ImageIcon className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Agregar rectángulo" onClick={onAddRect} className="size-8">
        <Square className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Agregar círculo" onClick={onAddCircle} className="size-8">
        <Circle className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        title="Botón interactivo"
        onClick={onAddButton}
        className="size-8"
      >
        <MousePointerClick className="size-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

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

      <div className="w-px h-5 bg-border mx-1" />

      <Button
        size="icon"
        variant="ghost"
        title="Eliminar elemento"
        onClick={onDelete}
        disabled={!hasSelection}
        className="size-8 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

// ─── Image URL overlay ────────────────────────────────────────────────────────

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

// ─── Main Editor Client ───────────────────────────────────────────────────────

export function SlideEditorClient({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  const updateSlide = useUpdateSlide(classId);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [selectedProps, setSelectedProps] = useState<SelectedObjectProps | null>(null);
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const apiRef = useRef<CanvasEditorAPI | null>(null);
  const selectedSlideIdRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    selectedSlideIdRef.current = selectedSlideId;
  }, [selectedSlideId]);

  // Select first slide once class loads
  useEffect(() => {
    if (cls?.slides?.length && !selectedSlideId) {
      const sorted = [...cls.slides].sort((a, b) => a.order - b.order);
      setSelectedSlideId(sorted[0].id);
    }
  }, [cls, selectedSlideId]);

  const selectedSlide = cls?.slides?.find((s) => s.id === selectedSlideId);
  const sortedSlides = cls?.slides ? [...cls.slides].sort((a, b) => a.order - b.order) : [];

  // ── Save current slide ──────────────────────────────────────────────────────
  const handleSave = useCallback(
    (silent = false) => {
      const slideId = selectedSlideIdRef.current;
      if (!apiRef.current || !slideId) return;

      const content: SlideContent = apiRef.current.save();
      setIsSaving(true);
      updateSlide.mutate(
        { slideId, content },
        {
          onSuccess: () => {
            if (!silent) toast.success('Slide guardado');
            setIsSaving(false);
          },
          onError: () => {
            if (!silent) toast.error('Error al guardar el slide');
            setIsSaving(false);
          },
        },
      );
    },
    [updateSlide],
  );

  // Auto-save every 30 s
  useEffect(() => {
    const timer = setInterval(() => handleSave(true), 30_000);
    return () => clearInterval(timer);
  }, [handleSave]);

  // Ctrl/Cmd+S shortcut
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

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">No se pudo cargar la clase.</p>
      </div>
    );
  }

  const previewStartIndex = Math.max(
    sortedSlides.findIndex((s) => s.id === selectedSlideId),
    0,
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-border shrink-0">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href={`/classes/${classId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <span className="font-semibold text-sm truncate">{cls?.title ?? 'Editor'}</span>
          )}
        </div>

        {selectedSlide && (
          <Badge variant="secondary" appearance="light" size="sm">
            {SLIDE_LABELS[selectedSlide.type] ?? selectedSlide.type} #{selectedSlide.order}
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(true)}
          disabled={sortedSlides.length === 0}
          title="Ver presentación fullscreen"
        >
          <Eye className="size-4" />
          Vista previa
        </Button>

        <Button
          size="sm"
          onClick={() => handleSave(false)}
          disabled={isSaving || !selectedSlideId}
        >
          <Save className="size-4" />
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel — slide list ───────────────────────────────────────── */}
        <aside className="w-52 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Slides
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              title="Nuevo slide"
              onClick={() => setShowAddSlide(true)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}

            {sortedSlides.map((slide) => {
              const isActive = slide.id === selectedSlideId;
              const bgColor = SLIDE_BG[slide.type] ?? 'bg-muted';
              return (
                <button
                  key={slide.id}
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={`w-full text-left rounded-md overflow-hidden border transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`${bgColor} h-12 flex items-center justify-center opacity-80`}>
                    <span className="text-xs text-white font-mono">{slide.order}</span>
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium truncate">{slide.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {SLIDE_LABELS[slide.type] ?? slide.type}
                    </p>
                  </div>
                </button>
              );
            })}

            {!isLoading && sortedSlides.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Sin slides — pulsa + para crear
              </p>
            )}
          </div>
        </aside>

        {/* ── Center: toolbar + canvas ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
          <EditorToolbar
            onAddText={() => apiRef.current?.addText()}
            onAddImage={() => setShowImageOverlay(true)}
            onAddRect={() => apiRef.current?.addRect()}
            onAddCircle={() => apiRef.current?.addCircle()}
            onAddButton={() => apiRef.current?.addButton()}
            onDelete={() => apiRef.current?.deleteSelected()}
            onBringToFront={() => apiRef.current?.bringToFront()}
            onSendToBack={() => apiRef.current?.sendToBack()}
            hasSelection={!!selectedProps}
          />

          <CanvasEditor
            content={selectedSlide?.content ?? null}
            onSelectionChange={setSelectedProps}
            onReady={(api) => {
              apiRef.current = api;
            }}
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

        {/* ── Right panel — properties ──────────────────────────────────────── */}
        <aside className="w-64 shrink-0 border-l border-border flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Propiedades
            </span>
          </div>
          <PropertiesPanel
            selected={selectedProps}
            onChangeProp={(key, value) => apiRef.current?.setProperty(key, value)}
          />
        </aside>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AddSlideModal
        classId={classId}
        open={showAddSlide}
        onOpenChange={setShowAddSlide}
        onCreated={(id) => setSelectedSlideId(id)}
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
