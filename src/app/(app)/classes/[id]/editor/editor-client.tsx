'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Monitor, Save, Send, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { useCreateSlide, useUpdateClass, useUpdateSlide } from '@/hooks/api/use-classes';
import { NewClassModal, type DesempenoGenerado, withActividadesSugeridas } from '../new-class-modal';
import {
  buildContentDocumentForNewActivitySlide,
  classSlideToRendererSlide,
  getSlideContentRecord,
  mergeSlideContent,
  removeBlockAtPath,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import type { Activity, Block } from '@/types/slide.types';
import { IconRail, type LeftPanelId } from './components/icon-rail';
import { FlyoutPanel } from './components/flyout-panel';
import { SlidesPanel } from './components/slides-panel';
import { CanvasArea } from './components/canvas-area';
import { RightRail, type RightPanelId } from './components/right-rail';
import { RightFlyoutPanel } from './components/right-flyout-panel';
import type { ActivityType } from './components/panels/activities-panel';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Save status ──────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle:   'Sin cambios',
  saving: 'Guardando…',
  saved:  'Guardado ✓',
  error:  'Error al guardar',
};

function shortAnswerTemplate(): Activity {
  return {
    tipo: 'short_answer',
    question: 'Nueva pregunta',
    expectedAnswer: '',
    caseSensitive: false,
    maxLength: 200,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clics en capas portadas (Radix) no deben cerrar los flyouts al usar menús/modales. */
function isPointerOnPortedOverlay(el: HTMLElement) {
  return !!(
    el.closest('[role="dialog"]') ||
    el.closest('[data-slot="dropdown-menu-content"]') ||
    el.closest('[data-slot="dropdown-menu-sub-content"]') ||
    el.closest('[data-slot="select-content"]') ||
    el.closest('[data-slot="popover-content"]') ||
    el.closest('[data-slot="tooltip-content"]')
  );
}

function hasDesempenoPersistido(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.enunciado === 'string' && o.enunciado.trim().length > 0) return true;
  const ind = o.indicadores;
  if (ind && typeof ind === 'object' && !Array.isArray(ind)) {
    return Object.values(ind as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
  }
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlideEditorClient({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  const updateSlide  = useUpdateSlide(classId);
  const updateClass  = useUpdateClass(classId, cls?.courseId ?? '');
  const createSlide  = useCreateSlide(classId);

  const [activePanel,        setActivePanel]        = useState<LeftPanelId | null>(null);
  const [rightPanel,         setRightPanel]         = useState<RightPanelId | null>(null);
  const [activeSlideIndex,   setActiveSlideIndex]   = useState(0);
  const [saveStatus,         setSaveStatus]         = useState<SaveStatus>('idle');
  const [modalUserOpen,      setModalUserOpen]      = useState(false);
  const [confirmedDesempeno, setConfirmedDesempeno] = useState<DesempenoGenerado | null>(null);

  const leftRailWrapRef = useRef<HTMLDivElement>(null);
  const flyoutPanelRef = useRef<HTMLElement>(null);
  const rightRailWrapRef = useRef<HTMLDivElement>(null);
  const rightFlyoutPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activePanel && !rightPanel) return;
    const handlePointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const el = e.target as HTMLElement;
      if (isPointerOnPortedOverlay(el)) return;

      if (activePanel) {
        if (flyoutPanelRef.current?.contains(t)) return;
        if (leftRailWrapRef.current?.contains(t)) return;
        if (rightRailWrapRef.current?.contains(t)) return;
        if (rightFlyoutPanelRef.current?.contains(t)) return;
        setActivePanel(null);
      }
      if (rightPanel) {
        if (rightFlyoutPanelRef.current?.contains(t)) return;
        if (rightRailWrapRef.current?.contains(t)) return;
        if (leftRailWrapRef.current?.contains(t)) return;
        if (flyoutPanelRef.current?.contains(t)) return;
        setRightPanel(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [activePanel, rightPanel]);

  // ─── Desempeño ──────────────────────────────────────────────────────────────

  const desempenoFromCls = useMemo(() => {
    if (!cls?.desempeno || !hasDesempenoPersistido(cls.desempeno)) return null;
    const raw = cls.desempeno as DesempenoGenerado;
    return withActividadesSugeridas({
      ...raw,
      actividadesSugeridas: Array.isArray(raw.actividadesSugeridas)
        ? raw.actividadesSugeridas
        : [],
    });
  }, [cls?.desempeno]);

  const desempeno = confirmedDesempeno ?? desempenoFromCls;

  const needsFirstTimeSetup =
    cls != null && !isLoading && !hasDesempenoPersistido(cls.desempeno);

  const modalOpen = needsFirstTimeSetup || modalUserOpen;

  // ─── Slides ─────────────────────────────────────────────────────────────────

  const sortedSlides = useMemo(() => {
    const slides = cls?.slides;
    if (!slides?.length) return [];
    return [...slides].sort((a, b) => a.order - b.order);
  }, [cls?.slides]);

  const resolvedSlideIndex = useMemo(() => {
    if (sortedSlides.length === 0) return 0;
    return Math.min(Math.max(0, activeSlideIndex), sortedSlides.length - 1);
  }, [sortedSlides.length, activeSlideIndex]);

  const activeSlide = sortedSlides[resolvedSlideIndex] ?? null;

  const rendererSlide = useMemo(
    () => (activeSlide ? classSlideToRendererSlide(activeSlide as ApiSlide) : null),
    [activeSlide],
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleLeftPanel = useCallback((id: LeftPanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  const toggleRightPanel = useCallback((id: RightPanelId) => {
    setRightPanel((prev) => (prev === id ? null : id));
  }, []);

  const handleRefreshDesempeno = useCallback(() => {
    setModalUserOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!activeSlide) return;
    setSaveStatus('saving');
    let payload: unknown = activeSlide.content ?? null;
    if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
      const s = sanitizeSlideContentForPersistence(payload);
      if (s !== null) payload = s;
    }
    updateSlide.mutate(
      { slideId: activeSlide.id, content: payload },
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

  const handleAddSlide = useCallback(() => {
    const nextOrder = sortedSlides.length + 1;
    createSlide.mutate(
      {
        type: 'CONTENT',
        title: 'Nuevo slide',
        content: {
          id: `slide_${Date.now()}`,
          orden: nextOrder,
          tipo: 'contenido',
          layout: 'titulo_y_contenido',
          fondo: { tipo: 'color', valor: '#FFFFFF' },
          bloques: [],
        },
      },
      {
        onSuccess: () => setActiveSlideIndex(nextOrder - 1),
        onError: () => toast.error('Error al crear el slide'),
      },
    );
  }, [sortedSlides.length, createSlide]);

  const handleCommitSlideContent = useCallback(
    (content: Record<string, unknown>) => {
      if (!activeSlide) return;
      const sanitized = sanitizeSlideContentForPersistence(content) ?? content;
      updateSlide.mutate(
        { slideId: activeSlide.id, content: sanitized },
        {
          onError: () => toast.error('No se pudo guardar el slide'),
        },
      );
    },
    [activeSlide, updateSlide],
  );

  const handleActivityChange = useCallback(
    (blockPath: string, activity: Activity) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'actividad') return b;
        return { ...b, actividad: activity };
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleRemoveBlock = useCallback(
    (blockPath: string) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = removeBlockAtPath(bloques, blockPath);
      if (next === bloques) return;
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
      toast.success('Actividad eliminada');
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleCreateSlideWithActivity = useCallback(
    (content: Record<string, unknown>, title: string) => {
      const nextOrder = sortedSlides.length + 1;
      const fullContent = { ...content, orden: nextOrder };
      const sanitized = sanitizeSlideContentForPersistence(fullContent) ?? fullContent;
      createSlide.mutate(
        {
          type: 'CONTENT',
          title,
          content: sanitized,
        },
        {
          onSuccess: () => setActiveSlideIndex(nextOrder - 1),
          onError: () => toast.error('No se pudo crear el slide'),
        },
      );
    },
    [sortedSlides.length, createSlide],
  );

  const handleAddActivity = useCallback(
    (type: ActivityType) => {
      if (type === 'short-answer') {
        const block: Block = { tipo: 'actividad', actividad: shortAnswerTemplate() };
        handleCreateSlideWithActivity(
          buildContentDocumentForNewActivitySlide(block),
          'Respuesta corta',
        );
        toast.success('Nuevo slide solo con la actividad');
        return;
      }
      toast.info(`Actividad "${type}" próximamente disponible`);
    },
    [handleCreateSlideWithActivity],
  );

  const handleApplyTheme = useCallback((bg: string) => {
    if (!activeSlide) return;
    const base = (
      typeof activeSlide.content === 'object' && activeSlide.content !== null
        ? activeSlide.content
        : {}
    ) as Record<string, unknown>;
    const updatedContent = { ...base, fondo: { tipo: 'color', valor: bg } };
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;
    updateSlide.mutate(
      { slideId: activeSlide.id, content: sanitized },
      {
        onSuccess: () => toast.success('Tema aplicado'),
        onError: () => toast.error('Error al aplicar tema'),
      },
    );
  }, [activeSlide, updateSlide]);

  // ─── Error state ─────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center p-6">
        <p className="text-sm text-destructive">No se pudo cargar la clase.</p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      {/* ── Móvil: no disponible (viewport menor que breakpoint md) ─────────── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center md:hidden">
        <Monitor className="size-12 shrink-0 text-muted-foreground" aria-hidden />
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold">Editor no disponible en el móvil</h2>
          <p className="text-sm text-muted-foreground">
            El editor de slides necesita una pantalla más ancha (tablet en horizontal, portátil o
            escritorio). Abre esta clase desde un dispositivo mayor o amplía la ventana del
            navegador.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/classes/${classId}`}>Volver a la clase</Link>
        </Button>
      </div>

      {/* ── Editor a pantalla completa — md+ (canvas centrado en el espacio flex) ─ */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden bg-editor-shell md:flex">

        {/* ── TOPBAR ── h-14 ──────────────────────────────────────────────── */}
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-background">

          {/* Zona Volver — 4rem fijo, alineada con IconRail del cuerpo */}
          <div className="flex h-full w-16 min-w-16 max-w-16 shrink-0 items-center justify-center border-r border-border bg-background">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={`/classes/${classId}`} aria-label="Volver a la clase">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Título + desempeño — flex-1 */}
          <div className="flex min-w-0 flex-1 flex-col px-3">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                <p className={cn('truncate text-sm font-semibold leading-tight')}>
                  {cls?.title ?? 'Editor'}
                </p>
                {desempeno && (
                  <p className="max-w-sm truncate text-xs text-muted-foreground">
                    {desempeno.enunciado.length > 80
                      ? desempeno.enunciado.slice(0, 80) + '…'
                      : desempeno.enunciado}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Botones acción — shrink-0 */}
          <div className="flex shrink-0 items-center gap-2 pr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Compartir próximamente disponible')}
            >
              <Share2 className="size-4" />
              Compartir
            </Button>

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
          </div>
        </header>

        {/* ── CUERPO (flex-1 + min-h-0 para canvas centrado y scroll correcto) ─ */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Icon rail — ancho fijo 4rem (md+); no encoger en flex */}
          <div
            ref={leftRailWrapRef}
            className="flex h-full min-h-0 w-16 min-w-16 max-w-16 shrink-0 flex-col overflow-hidden"
          >
            <IconRail
              activePanel={activePanel}
              onPanelToggle={toggleLeftPanel}
              onRefreshDesempeno={handleRefreshDesempeno}
            />
          </div>

          {/* Slides + flyout — 14rem fijo; canvas absorbe el resto (min-w-0) */}
          <div className="relative h-full min-h-0 w-56 min-w-56 max-w-56 shrink-0 overflow-visible">
            <SlidesPanel
              slides={sortedSlides}
              activeIndex={resolvedSlideIndex}
              isLoading={isLoading}
              isAddingSlide={createSlide.isPending}
              onSelect={setActiveSlideIndex}
              onAddSlide={handleAddSlide}
            />
            <FlyoutPanel
              ref={flyoutPanelRef}
              activePanel={activePanel}
              onClose={() => setActivePanel(null)}
              apiSlide={activeSlide as ApiSlide}
              onCommitSlideContent={handleCommitSlideContent}
              onCreateActivitySlide={handleCreateSlideWithActivity}
              slides={sortedSlides.map((s) => ({
                id: s.id,
                order: s.order,
                title: s.title,
                type: s.type,
              }))}
              activeSlideIndex={resolvedSlideIndex}
              onSelectSlide={setActiveSlideIndex}
              desempenoEnunciado={desempeno?.enunciado}
              isSlideSaving={updateSlide.isPending}
            />
          </div>

          {/* Canvas area — flex-1 */}
          <CanvasArea
            slide={rendererSlide}
            isLoading={isLoading}
            onActivityChange={handleActivityChange}
            onRemoveBlock={handleRemoveBlock}
          />

          {/* Flyout panel derecho */}
          <RightFlyoutPanel
            ref={rightFlyoutPanelRef}
            activePanel={rightPanel}
            onClose={() => setRightPanel(null)}
            onAddActivity={handleAddActivity}
            onApplyTheme={handleApplyTheme}
            desempenoEnunciado={desempeno?.enunciado}
          />

          {/* Icon rail derecho — w-16 (fuera del cierre por click exterior) */}
          <div
            ref={rightRailWrapRef}
            className="flex h-full min-h-0 w-16 min-w-16 max-w-16 shrink-0 flex-col overflow-hidden"
          >
            <RightRail
              activePanel={rightPanel}
              onPanelToggle={toggleRightPanel}
            />
          </div>

        </div>

        {/* ── STATUS BAR ───────────────────────────────────────────────────── */}
        <footer className="flex min-h-9 shrink-0 items-center justify-between border-t border-border bg-background px-4 py-1.5">
          <span
            className={cn(
              'text-xs tabular-nums',
              saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {SAVE_LABEL[saveStatus]}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sortedSlides.length} {sortedSlides.length === 1 ? 'slide' : 'slides'}
          </span>
        </footer>

      </div>

      <NewClassModal
        classId={classId}
        isOpen={modalOpen}
        required={needsFirstTimeSetup}
        onClose={() => setModalUserOpen(false)}
        onConfirm={(d) => {
          const normalized = withActividadesSugeridas(d);
          setConfirmedDesempeno(normalized);
          setModalUserOpen(false);
          updateClass.mutate(
            { desempeno: normalized },
            {
              onError: () =>
                toast.error('No se pudo guardar el desempeño en el servidor'),
            },
          );
        }}
      />
    </div>
  );
}
