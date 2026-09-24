'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookOpen, ChevronLeft, ChevronRight, Copy, Loader2 } from 'lucide-react';
import { useDuplicateHelpGuide, useHelpGuide } from '@/hooks/api/use-help-guide';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { DARK_BACKGROUNDS, getBackground } from '@/lib/class-backgrounds';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../../classes/[id]/editor/components/slide-renderer';
import { SlideNavContext, type SlideNavAction } from '@lumina/editor-shared/slide-nav-context';
import { TextTokensProvider, textTokenExtra } from '@lumina/editor-shared/rich-text';
import { Button } from '@lumina/ui/button';

/**
 * "Guía de Lumina" (X.2) — página de solo lectura. Deliberadamente NO usa
 * `useClass(id)` ni el visor estándar (`/classes/[id]/present|viewer`) — esa
 * ruta exige propiedad de la clase (`ClassesService.findOne`), y la clase de
 * sistema es propiedad de un SUPERADMIN sin curso. Consume `/help/guide`
 * (sin ese chequeo) y renderiza con `<SlideRenderer modo="viewer">`, igual
 * que hace `preview-client.tsx` para clases normales.
 */
export function HelpGuideClient() {
  const router = useRouter();
  const guideQuery = useHelpGuide({ enabled: true });
  const duplicateMutation = useDuplicateHelpGuide();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const guide = guideQuery.data;

  const slides = useMemo(() => {
    const raw = guide?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [guide?.slides]);

  const activeSlide = slides[activeSlideIndex] ?? null;

  const navigateSlide = useCallback(
    (action: SlideNavAction) => {
      if (action.kind === 'siguiente') {
        setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1));
      } else if (action.kind === 'anterior') {
        setActiveSlideIndex((i) => Math.max(0, i - 1));
      } else {
        setActiveSlideIndex(Math.min(slides.length - 1, Math.max(0, action.index)));
      }
    },
    [slides.length],
  );

  const handleDuplicate = () => {
    duplicateMutation.mutate(undefined, {
      onSuccess: (created) => {
        toast.success('Copia creada en tus clases.');
        router.push(`/classes/${created.id}/editor`);
      },
      onError: () => {
        toast.error('No se pudo duplicar la guía. Intenta de nuevo.');
      },
    });
  };

  if (guideQuery.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#9ca3af]" aria-label="Cargando" />
      </div>
    );
  }

  if (guideQuery.isError || !guide) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <BookOpen className="size-8 text-[#9ca3af]" />
        <p className="text-sm font-medium text-[#6b7280]">
          La guía de Lumina todavía no está disponible.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    );
  }

  const bg = getBackground(guide.background ?? 'none');
  const slideCanvasVariant: 'dark' | 'light' = DARK_BACKGROUNDS.includes(bg.id)
    ? 'dark'
    : 'light';

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">{guide.title}</h1>
          <p className="text-lumina-sm text-[#6b7280]">
            Solo lectura — duplícala para editar tu propia copia.
          </p>
        </div>
        <Button onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
          {duplicateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Copy className="size-4" />
          )}
          Duplicar a mis clases
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
        {activeSlide ? (
          <div
            className="relative aspect-video w-full max-w-4xl select-none overflow-hidden rounded-lg shadow-lumina-sm"
            style={bg.style}
          >
            <SlideNavContext.Provider
              value={{ navigate: navigateSlide, slideCount: slides.length, slideIndex: activeSlideIndex }}
            >
              <TextTokensProvider value={{ extra: textTokenExtra({ clase: guide.title }) }}>
                <SlideRenderer
                  slide={activeSlide}
                  modo="viewer"
                  viewerFill
                  onResponse={() => undefined}
                  variant={slideCanvasVariant}
                  liveSocket={null}
                  torneoSocket={null}
                  viewerStudentId=""
                  viewerStudentName="Docente"
                  viewerClassId={guide.id}
                />
              </TextTokensProvider>
            </SlideNavContext.Provider>
          </div>
        ) : (
          <p className="py-12 text-center text-sm font-medium text-[#6b7280]">
            Esta guía todavía no tiene diapositivas.
          </p>
        )}

        {slides.length > 1 ? (
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Diapositiva anterior"
              disabled={activeSlideIndex <= 0}
              onClick={() => setActiveSlideIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-lumina-sm text-[#6b7280]">
              {activeSlideIndex + 1} / {slides.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Diapositiva siguiente"
              disabled={activeSlideIndex >= slides.length - 1}
              onClick={() => setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
