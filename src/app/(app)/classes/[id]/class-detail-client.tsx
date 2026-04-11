'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Play,
  Pencil,
  Zap,
  Image as ImageIcon,
  Video,
  Type,
  Shapes,
  HelpCircle,
  ToggleLeft,
  MessageSquare,
  PenLine,
  GripHorizontal,
  GitMerge,
  ListOrdered,
  BarChart2,
  Cloud,
  LayoutList,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { useClass } from '@/hooks/api/use-class';
import { usePublishClass } from '@/hooks/api/use-classes';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { SLIDE_LABELS } from '@/config/slide.constants';
import { cn } from '@/lib/utils';
import type { CSSProperties, ReactNode } from 'react';

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

// ─── Thumbnail Logic (Copied from slides-panel.tsx) ──────────────────────────

const ACTIVITY_PREVIEW: Record<string, { Icon: any; label: string }> = {
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

function firstImageBlockUrl(bloques: Record<string, unknown>[]): string | null {
  for (const b of bloques) {
    if (b.tipo !== 'imagen') continue;
    const url = typeof b.url === 'string' ? b.url : '';
    if (url.length > 0) return url;
  }
  return null;
}

function stripToPlainText(htmlOrText: string): string {
  return htmlOrText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function CornerTypeIcon({ pick, className }: { pick: CornerPick | null; className?: string }) {
  if (!pick) return null;
  if (pick.kind === 'actividad') {
    const def = ACTIVITY_PREVIEW[pick.activityType];
    const Icon = def?.Icon ?? HelpCircle;
    return <Icon className={cn("text-white drop-shadow-sm", className)} aria-hidden />;
  }
  if (pick.kind === 'imagen') {
    return <ImageIcon className={cn("text-white drop-shadow-sm", className)} aria-hidden />;
  }
  if (pick.kind === 'video') {
    return <Video className={cn("text-white drop-shadow-sm", className)} aria-hidden />;
  }
  if (pick.kind === 'texto') {
    return <Type className={cn("text-white drop-shadow-sm", className)} aria-hidden />;
  }
  return <Shapes className={cn("text-white drop-shadow-sm", className)} aria-hidden />;
}

function SlideThumbnailPreview({
  slide,
  isActive,
  size = 'small',
}: {
  slide: any;
  isActive: boolean;
  size?: 'small' | 'large';
}) {
  const bloques = getSlideBloques(slide.content);
  const fondo = getSlideFondo(slide.content);
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
    const tClass =
      size === 'large'
        ? 'text-lg sm:text-2xl md:text-3xl lg:text-4xl line-clamp-4 max-w-[85%]'
        : 'text-[6px] line-clamp-2 max-w-[95%]';
    main = (
      <p
        className={cn(
          'relative z-[1] whitespace-pre-line text-center leading-tight text-white drop-shadow-md',
          tClass,
        )}
      >
        {textPreview}
      </p>
    );
  } else if (activity) {
    const iClass = size === 'large' ? 'size-16 sm:size-24' : 'size-3';
    const lClass = size === 'large' ? 'text-xl sm:text-3xl mt-4 opacity-90' : 'text-[6px] mt-0.5';
    main = (
      <div className="relative z-[1] flex max-w-[95%] flex-col items-center text-white drop-shadow-md">
        <ActivityIcon className={cn('shrink-0', iClass)} aria-hidden />
        <span className={cn('text-center font-medium leading-tight', lClass)}>{activityLabel}</span>
      </div>
    );
  } else {
    const nClass = size === 'large' ? 'text-6xl sm:text-9xl' : 'text-sm';
    main = (
      <span
        className={cn(
          'relative z-[1] font-bold text-white/90 drop-shadow-md tabular-nums',
          nClass,
        )}
      >
        {slide.order}
      </span>
    );
  }

  const badgeClass = size === 'large' ? 'left-3 top-3 px-2 py-0.5 text-sm sm:text-base rounded' : 'left-0.5 top-0.5 px-1 text-[7px] rounded-sm';
  const cornerClass = size === 'large' ? 'size-6 sm:size-8' : 'size-2';
  const cornerPos = size === 'large' ? 'bottom-4 right-4' : 'bottom-0.5 right-0.5';

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center overflow-hidden rounded-md',
        !hasCustomBg && !imageBlockUrl && 'bg-zinc-800',
        isActive ? 'ring-2 ring-primary' : size === 'small' ? 'ring-1 ring-zinc-600/50 hover:ring-zinc-400' : 'ring-1 ring-border',
      )}
      style={{ aspectRatio: size === 'small' ? '4/3' : '16/9', ...bgStyle }}
    >
      <span
        className={cn(
          'absolute z-[1] bg-black/60 font-medium tabular-nums text-white',
          badgeClass
        )}
      >
        {slide.order}
      </span>
      {imageBlockUrl ? (
        main
      ) : (
        <div className="pointer-events-none flex min-h-0 flex-1 items-center justify-center p-4">
          {main}
        </div>
      )}
      <div className={cn('pointer-events-none absolute z-[1] flex items-center justify-center', cornerPos)}>
        <CornerTypeIcon pick={cornerPick} className={cornerClass} />
      </div>
    </div>
  );
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
  }, [cls?.slides]);

  const activeSlide = sortedSlides[activeIndex];

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
                <div className="relative w-full rounded overflow-hidden">
                  <SlideThumbnailPreview slide={activeSlide} isActive={false} size="large" />
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
                    <button
                      key={slide.id}
                      onClick={() => setActiveIndex(i)}
                      className="group shrink-0 w-24 sm:w-28 xl:w-32 snap-start flex flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <div className="w-full relative rounded-md overflow-hidden transition-transform group-hover:scale-105">
                        <SlideThumbnailPreview slide={slide} isActive={i === activeIndex} size="small" />
                      </div>
                      <span className={cn('text-xs font-medium', i === activeIndex ? 'text-primary' : 'text-muted-foreground')}>
                        Slide {slide.order}
                      </span>
                    </button>
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
                  {(cls as any)?.code && (
                    <Badge variant="outline" size="sm" className="font-mono text-muted-foreground">
                      {(cls as any).code}
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
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg" disabled>
                  <Play className="size-4 mr-2" />
                  Iniciar clase
                </Button>
                
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href={`/classes/${id}/editor`}>
                    <Pencil className="size-4 mr-2" />
                    Abrir editor
                  </Link>
                </Button>

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

