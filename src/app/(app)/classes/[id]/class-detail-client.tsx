'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  LayoutList,
  Send,
  Presentation,
} from 'lucide-react';
import { toast } from 'sonner';

import { useClass } from '@/hooks/api/use-class';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { usePublishClass } from '@/hooks/api/use-classes';
import {
  getActiveAutonomousSession,
  getAutonomousActionBadge,
  useAutonomousSessions,
} from '@/hooks/api/use-autonomous-sessions';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { SlideRenderer } from './editor/components/slide-renderer';
import { SlideCanvasThumb } from './editor/components/slides-panel';
import {
  STATUS_BADGE_STYLE,
  STATUS_LABELS,
} from '@/app/(app)/classes/class-status-badge-styles';
import { EditAutonomousModal } from './components/edit-autonomous-modal';
import { LaunchAutonomousModal } from './components/launch-autonomous-modal';

function statusLabel(status: string) {
  return STATUS_LABELS[status?.toUpperCase()] ?? status;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassDetailClient({ id }: { id: string }) {
  const { data: cls, isLoading, isError } = useClass(id);
  const publishMutation = usePublishClass(cls?.courseId ?? '');
  const { data: autonomousSessions } = useAutonomousSessions(id, { refetchInterval: 30_000 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [launchAutonomousOpen, setLaunchAutonomousOpen] = useState(false);
  const [editAutonomousOpen, setEditAutonomousOpen] = useState(false);

  const activeSession = useMemo(
    () => getActiveAutonomousSession(autonomousSessions),
    [autonomousSessions],
  );
  const autonomousActionBadge = useMemo(
    () => getAutonomousActionBadge(activeSession),
    [activeSession],
  );

  useEffect(() => {
    if (!activeSession) setEditAutonomousOpen(false);
  }, [activeSession]);

  const isDraft = cls?.status?.toUpperCase() === 'DRAFT';
  const statusBadgeStyle =
    STATUS_BADGE_STYLE[cls?.status?.toUpperCase() ?? ''] ?? STATUS_BADGE_STYLE.DRAFT;

  const sortedSlides = useMemo(() => {
    if (!cls?.slides) return [];
    return [...cls.slides].sort((a, b) => a.order - b.order);
  }, [cls]);

  const activeSlide = sortedSlides[activeIndex];
  const rendererActiveSlide = useMemo(
    () => (activeSlide ? classSlideToRendererSlide(activeSlide as unknown as ApiSlide) : null),
    [activeSlide]
  );

  const handlePrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setActiveIndex((prev) => Math.min(sortedSlides.length - 1, prev + 1));

  if (isError) {
    return (
      <div className="w-full p-6">
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>No se pudo cargar la clase.</AlertTitle>
          </AlertContent>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="w-full aspect-[16/9] rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="w-24 aspect-[4/3] rounded-md" />
              <Skeleton className="w-24 aspect-[4/3] rounded-md" />
              <Skeleton className="w-24 aspect-[4/3] rounded-md" />
            </div>
          </div>
          <div className="w-full lg:w-72 space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/classes"
          className="inline-flex items-center justify-center size-8 rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs hover:bg-[#f9fafb] text-[#6b7280] -ml-2"
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-[#111827]">Detalles de la Clase</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column - Slide Preview */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {sortedSlides.length > 0 ? (
            <>
              {/* Grand Preview */}
              <div className="relative group w-full bg-[#f9fafb] rounded-xl p-2 border border-[#e5e7eb] shadow-lumina-sm">
                <div className="relative w-full rounded overflow-hidden bg-white">
                  {rendererActiveSlide && (
                    <SlideRenderer slide={rendererActiveSlide} modo="preview" />
                  )}
                </div>

                {/* Navigation Controls overlay */}
                {activeIndex > 0 && (
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity size-8 flex items-center justify-center bg-white border border-[#e5e7eb] shadow-lumina-sm text-[#6b7280] hover:bg-[#f9fafb]"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                )}
                {activeIndex < sortedSlides.length - 1 && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity size-8 flex items-center justify-center bg-white border border-[#e5e7eb] shadow-lumina-sm text-[#6b7280] hover:bg-[#f9fafb]"
                    onClick={handleNext}
                  >
                    <ChevronRight className="size-5" />
                  </button>
                )}
              </div>

              {/* Minis */}
              <div className="relative w-full">
                <div
                  className="flex overflow-x-auto gap-3 pb-4 pt-1 px-1 snap-x"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {sortedSlides.map((slide, i) => (
                    <div
                      key={slide.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveIndex(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                      }}
                      className="group w-24 shrink-0 snap-start cursor-pointer focus:outline-none sm:w-28 xl:w-32"
                    >
                      <div className="relative w-full overflow-hidden rounded-md transition-transform group-hover:scale-105">
                        <SlideCanvasThumb slide={slide as unknown as Parameters<typeof SlideCanvasThumb>[0]['slide']} isActive={i === activeIndex} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full aspect-[16/9] flex flex-col items-center justify-center bg-[#f9fafb] border border-dashed border-[#e5e7eb] rounded-xl gap-4">
              <div className="bg-white border border-[#e5e7eb] p-4 rounded-full shadow-lumina-xs">
                <LayoutList className="size-8 text-[#9ca3af]" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lumina-lg text-[#111827]">No hay slides</h3>
                <p className="text-lumina-sm text-[#6b7280]">Abre el editor para comenzar a crear tu clase.</p>
              </div>
              <Link
                href={`/classes/${id}/editor`}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-lumina-sm font-bold text-white hover:bg-[#1d4ed8]"
              >
                <Pencil className="size-4" />
                Abrir editor
              </Link>
            </div>
          )}
        </div>

        {/* Right Column - Info & Actions */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-lumina-sm overflow-hidden sticky top-6">
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {cls?.status && (
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: statusBadgeStyle.bg,
                        color: statusBadgeStyle.color,
                      }}
                    >
                      {statusLabel(cls.status)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold tracking-tight leading-tight break-words text-[#111827]">
                  {cls?.title ?? 'Clase sin título'}
                </h2>
                {cls?.description && (
                  <p className="text-lumina-sm text-[#6b7280] line-clamp-3">
                    {cls.description}
                  </p>
                )}
              </div>

              <div className="border-t border-[#e5e7eb]" />

              <dl className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <dt className="text-lumina-sm text-[#9ca3af] mb-1">Fecha</dt>
                  <dd className="text-lumina-sm font-semibold text-[#111827]">
                    {cls?.createdAt
                      ? new Date(cls.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-lumina-sm text-[#9ca3af] mb-1">Slides</dt>
                  <dd className="text-lumina-sm font-semibold text-[#111827]">{sortedSlides.length}</dd>
                </div>
              </dl>

              <div className="border-t border-[#e5e7eb]" />

              {sortedSlides.length > 0 && (
                <div className="text-center px-3 py-2 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                  <span className="text-lumina-sm font-semibold text-[#6b7280]">
                    Diapositiva{' '}
                    <span className="font-extrabold text-[#2563EB]">{activeIndex + 1}</span>
                    {' '}de {sortedSlides.length}
                  </span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {(cls as unknown as Record<string, string>)?.codigo ? (
                  <button
                    type="button"
                    className="flex w-full cursor-default items-center justify-center rounded-md bg-[#2563EB] px-4 py-2 font-mono text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
                    aria-label="Código de la clase"
                  >
                    {(cls as unknown as Record<string, string>).codigo.toUpperCase()}
                  </button>
                ) : null}

                <div className="flex gap-2">
                  <Link
                    href={`/classes/${id}/editor`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] shadow-lumina-xs hover:bg-[#f9fafb]"
                  >
                    <Pencil className="size-4 text-[#2563EB]" />
                    Editor
                  </Link>
                  <Link
                    href={`/classes/${id}/present`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] shadow-lumina-xs hover:bg-[#f9fafb]"
                  >
                    <Presentation className="size-4 text-[#6b7280]" />
                    Presentar
                  </Link>
                </div>

                {sortedSlides.length > 0 ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      disabled={sortedSlides.length === 0 || (!activeSession && !cls?.codigo)}
                      title={
                        !activeSession && !cls?.codigo
                          ? 'Publica la clase para obtener código de acceso'
                          : undefined
                      }
                      onClick={() =>
                        activeSession ? setEditAutonomousOpen(true) : setLaunchAutonomousOpen(true)
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] shadow-lumina-xs hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Autónomo
                    </button>
                    {autonomousActionBadge.kind ? (
                      <span
                        className="flex w-full justify-center rounded-lumina-md px-2 py-1.5 text-center text-xs font-semibold"
                        style={
                          autonomousActionBadge.kind === 'scheduled'
                            ? { backgroundColor: '#fef3c7', color: '#d97706' }
                            : { backgroundColor: '#dcfce7', color: '#16a34a' }
                        }
                      >
                        {autonomousActionBadge.label}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {isDraft && (
                  <button
                    type="button"
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-lumina-sm font-semibold text-[#6b7280] shadow-lumina-xs hover:bg-[#f9fafb] disabled:opacity-50"
                    disabled={publishMutation.isPending}
                    onClick={() => {
                      publishMutation.mutate(id, {
                        onSuccess: () => toast.success('Clase publicada correctamente'),
                        onError: () => toast.error('Error al publicar la clase'),
                      });
                    }}
                  >
                    {publishMutation.isPending ? 'Publicando...' : 'Publicar clase'}
                    <Send className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mantener el modal montado tras crear la sesión: si no, activeSession pasa a existir,
          el modal se desmonta y se pierde el paso 3 (enlace y PIN). */}
      {cls?.codigo && (!activeSession || launchAutonomousOpen) ? (
        <LaunchAutonomousModal
          open={launchAutonomousOpen}
          onOpenChange={setLaunchAutonomousOpen}
          classId={id}
          classCode={cls.codigo.toUpperCase()}
        />
      ) : null}
      {activeSession ? (
        <EditAutonomousModal
          key={activeSession.id}
          open={editAutonomousOpen}
          onOpenChange={setEditAutonomousOpen}
          classId={id}
          session={activeSession}
          classCode={(cls?.codigo ?? '').toUpperCase()}
        />
      ) : null}
    </div>
  );
}
