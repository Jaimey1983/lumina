'use client';

import { useState, useMemo } from 'react';
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
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SlideRenderer } from './editor/components/slide-renderer';
import { SlideCanvasThumb } from './editor/components/slides-panel';

// ─── Helpers Status ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  LIVE: 'En vivo',
  ARCHIVED: 'Archivada',
};

const STATUS_VARIANTS: Record<
  string,
  'secondary' | 'success' | 'warning' | 'destructive' | 'primary'
> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  LIVE: 'primary',
  ARCHIVED: 'destructive',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status?.toUpperCase()] ?? status;
}

function statusVariant(status: string) {
  return STATUS_VARIANTS[status?.toUpperCase()] ?? 'secondary';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassDetailClient({ id }: { id: string }) {
  const { data: cls, isLoading, isError } = useClass(id);
  const publishMutation = usePublishClass(cls?.courseId ?? '');

  const [activeIndex, setActiveIndex] = useState(0);

  const isDraft = cls?.status?.toUpperCase() === 'DRAFT';

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
      <div className="container py-6">
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
      <div className="container py-6">
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
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/classes">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold opacity-80">Detalles de la Clase</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column - Slide Preview */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {sortedSlides.length > 0 ? (
            <>
              {/* Grand Preview */}
              <div className="relative group w-full bg-muted/30 rounded-xl p-2 border border-border/50 shadow-sm">
                <div className="relative w-full rounded overflow-hidden bg-background">
                  {rendererActiveSlide && (
                    <SlideRenderer slide={rendererActiveSlide} modo="preview" />
                  )}
                </div>

                {/* Navigation Controls overlay */}
                {activeIndex > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                )}
                {activeIndex < sortedSlides.length - 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleNext}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
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
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
                      className="group shrink-0 w-24 sm:w-28 xl:w-32 snap-start flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-full relative rounded-md overflow-hidden transition-transform group-hover:scale-105">
                        <SlideCanvasThumb slide={slide as unknown as Parameters<typeof SlideCanvasThumb>[0]['slide']} isActive={i === activeIndex} />
                      </div>
                      <span className={cn('text-xs font-medium', i === activeIndex ? 'text-primary' : 'text-muted-foreground')}>
                        Slide {slide.order}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full aspect-[16/9] flex flex-col items-center justify-center bg-muted/20 border border-dashed rounded-xl gap-4">
              <div className="bg-muted p-4 rounded-full">
                <LayoutList className="size-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium text-lg">No hay slides</h3>
                <p className="text-muted-foreground">Abre el editor para comenzar a crear tu clase.</p>
              </div>
              <Button asChild className="mt-2">
                <Link href={`/classes/${id}/editor`}>
                  <Pencil className="size-4 mr-2" />
                  Abrir editor
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Info & Actions */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {cls?.status && (
                    <Badge variant={statusVariant(cls.status)} appearance="light" size="sm">
                      {statusLabel(cls.status)}
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-semibold leading-tight break-words">
                  {cls?.title ?? 'Clase sin título'}
                </h2>
                {cls?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {cls.description}
                  </p>
                )}
              </div>

              <Separator />

              <dl className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">Fecha</dt>
                  <dd className="font-medium">
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
                  <dt className="text-muted-foreground mb-1">Slides</dt>
                  <dd className="font-medium">{sortedSlides.length}</dd>
                </div>
              </dl>

              <Separator />

              {sortedSlides.length > 0 && (
                <div className="text-center px-3 py-2 bg-muted/40 rounded-lg">
                  <span className="text-sm font-medium">
                    Diapositiva <span className="text-primary">{activeIndex + 1}</span> de {sortedSlides.length}
                  </span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {(cls as unknown as Record<string, string>)?.codigo ? (
                  <div
                    className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2.5 font-mono text-sm font-medium text-white"
                    aria-label="Código de la clase"
                  >
                    {(cls as unknown as Record<string, string>).codigo.toUpperCase()}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button variant="outline" className="w-full flex-1" size="lg" asChild>
                    <Link href={`/classes/${id}/editor`}>
                      <Pencil className="size-4 mr-2" />
                      Editor
                    </Link>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full flex-1 bg-gray-100 hover:bg-gray-200 text-foreground" 
                    size="lg" 
                    asChild
                  >
                    <Link href={`/classes/${id}/present`}>
                      <Presentation className="size-4 mr-2" />
                      Presentar
                    </Link>
                  </Button>
                </div>

                {isDraft && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-muted-foreground hover:text-foreground"
                    disabled={publishMutation.isPending}
                    onClick={() => {
                      publishMutation.mutate(id, {
                        onSuccess: () => toast.success('Clase publicada correctamente'),
                        onError: () => toast.error('Error al publicar la clase'),
                      });
                    }}
                  >
                    {publishMutation.isPending ? 'Publicando...' : 'Publicar clase'}
                    <Send className="size-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

