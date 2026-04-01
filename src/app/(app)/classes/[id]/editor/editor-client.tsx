'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Eye,
  Layers,
  LayoutTemplate,
  Palette,
  Save,
  Send,
  Shapes,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { useClass } from '@/hooks/api/use-class';
import { useUpdateSlide } from '@/hooks/api/use-classes';
import { SlideRenderer } from './components/slide-renderer';
import type { Slide as SlideSchema } from '@/types/slide.types';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ─── Icon Rail ────────────────────────────────────────────────────────────────

type PanelId = 'elementos' | 'actividades' | 'layout' | 'fondo' | 'ia' | 'paginas';

interface RailItem {
  id: PanelId;
  label: string;
  Icon: LucideIcon;
}

const RAIL_ITEMS: RailItem[] = [
  { id: 'elementos',   label: 'Elementos',   Icon: Shapes },
  { id: 'actividades', label: 'Actividades', Icon: Zap },
  { id: 'layout',      label: 'Layout',      Icon: LayoutTemplate },
  { id: 'fondo',       label: 'Fondo',       Icon: Palette },
  { id: 'ia',          label: 'IA',          Icon: Sparkles },
  { id: 'paginas',     label: 'Páginas',     Icon: Layers },
];

const PANEL_TITLES: Record<PanelId, string> = {
  elementos:   'Elementos',
  actividades: 'Actividades',
  layout:      'Layout',
  fondo:       'Fondo',
  ia:          'Inteligencia Artificial',
  paginas:     'Páginas',
};

// ─── Slide thumbnails ─────────────────────────────────────────────────────────

const SLIDE_THUMB_BG: Record<string, string> = {
  COVER:    'bg-violet-100 dark:bg-violet-900/40',
  CONTENT:  'bg-blue-100 dark:bg-blue-900/40',
  ACTIVITY: 'bg-amber-100 dark:bg-amber-900/40',
  VIDEO:    'bg-rose-100 dark:bg-rose-900/40',
  IMAGE:    'bg-emerald-100 dark:bg-emerald-900/40',
};

const SLIDE_TYPE_LABEL: Record<string, string> = {
  COVER:    'Portada',
  CONTENT:  'Contenido',
  ACTIVITY: 'Actividad',
  VIDEO:    'Video',
  IMAGE:    'Imagen',
};

// ─── Save status ──────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle:   'Sin cambios',
  saving: 'Guardando…',
  saved:  'Guardado ✓',
  error:  'Error al guardar',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SlideEditorClient({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  const updateSlide = useUpdateSlide(classId);

  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const sortedSlides = useMemo(() => {
    if (!cls?.slides?.length) return [];
    return [...cls.slides].sort((a, b) => a.order - b.order);
  }, [cls?.slides]);

  const activeSlide = sortedSlides[activeSlideIndex] ?? null;

  function togglePanel(id: PanelId) {
    setActivePanel((prev) => (prev === id ? null : id));
  }

  const handleSave = useCallback(() => {
    if (!activeSlide) return;
    setSaveStatus('saving');
    updateSlide.mutate(
      { slideId: activeSlide.id, content: activeSlide.content ?? null },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          toast.success('Slide guardado');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setSaveStatus('error');
          toast.error('Error al guardar');
        },
      },
    );
  }, [activeSlide, updateSlide]);

  if (isError) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-destructive">No se pudo cargar la clase.</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href={`/classes/${classId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>

        <div className="h-5 w-px bg-border" />

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <span className="truncate text-sm font-semibold">{cls?.title ?? 'Editor'}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={sortedSlides.length === 0}
          onClick={() => toast.info('Vista previa no disponible aún')}
        >
          <Eye className="size-4" />
          Vista previa
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!activeSlide || saveStatus === 'saving'}
          onClick={handleSave}
        >
          <Save className="size-4" />
          {saveStatus === 'saving' ? 'Guardando…' : 'Guardar'}
        </Button>

        <Button
          size="sm"
          disabled={!activeSlide}
          onClick={() => toast.info('Publicación no disponible aún')}
        >
          <Send className="size-4" />
          Publicar
        </Button>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Icon Rail ─────────────────────────────────────────────────────── */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-muted/10 py-2">
          {RAIL_ITEMS.map(({ id, label, Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => togglePanel(id)}
                  aria-label={label}
                  aria-pressed={activePanel === id}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md transition-colors',
                    'text-muted-foreground hover:bg-accent hover:text-foreground',
                    activePanel === id && 'bg-accent text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </aside>

        {/* ── Flyout Panel ──────────────────────────────────────────────────── */}
        <aside
          className={cn(
            'flex shrink-0 flex-col overflow-hidden border-r border-border bg-background transition-[width] duration-200',
            activePanel ? 'w-64' : 'w-0',
          )}
        >
          {activePanel && (
            <div className="flex h-full w-64 flex-col">
              <div className="flex h-10 shrink-0 items-center border-b border-border px-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {PANEL_TITLES[activePanel]}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {PANEL_TITLES[activePanel]}
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Slides Panel ──────────────────────────────────────────────────── */}
        <aside className="flex w-44 shrink-0 flex-col overflow-hidden border-r border-border bg-muted/5">
          <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Slides
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {sortedSlides.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}

            {sortedSlides.map((slide, idx) => {
              const isActive = idx === activeSlideIndex;
              const thumbBg = SLIDE_THUMB_BG[slide.type] ?? 'bg-muted';
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className={cn(
                    'w-full overflow-hidden rounded-md border text-left transition-all',
                    isActive
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {/* Thumbnail rect */}
                  <div className={cn('flex h-16 items-center justify-center', thumbBg)}>
                    <span className="font-mono text-xs font-bold text-foreground/40">
                      {slide.order}
                    </span>
                  </div>
                  {/* Label */}
                  <div className="px-2 py-1">
                    <p className="truncate text-[10px] font-medium leading-tight">{slide.title}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {SLIDE_TYPE_LABEL[slide.type] ?? slide.type}
                    </p>
                  </div>
                </button>
              );
            })}

            {!isLoading && sortedSlides.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">Sin slides</p>
            )}
          </div>
        </aside>

        {/* ── Canvas Area ───────────────────────────────────────────────────── */}
        <main className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-neutral-100 p-8 dark:bg-neutral-900">
          {isLoading ? (
            <Skeleton
              className="rounded-md shadow-lg"
              style={{ aspectRatio: '16/9', width: 'min(100%, calc((100dvh - 8rem) * 16 / 9))' }}
            />
          ) : activeSlide ? (
            <div
              className="relative overflow-hidden rounded-sm shadow-xl"
              style={{ aspectRatio: '16/9', width: 'min(100%, calc((100dvh - 8rem) * 16 / 9))' }}
            >
              <SlideRenderer
                slide={activeSlide as unknown as SlideSchema}
                modo="editor"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">Sin slides</p>
              <p className="text-xs text-muted-foreground">
                Agrega slides desde el panel de páginas
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── Status Bar ──────────────────────────────────────────────────────── */}
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-muted/5 px-4">
        <span
          className={cn(
            'text-[10px]',
            saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {SAVE_LABEL[saveStatus]}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {sortedSlides.length} {sortedSlides.length === 1 ? 'slide' : 'slides'}
        </span>
      </footer>
    </div>
  );
}
