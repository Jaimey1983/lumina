'use client';

import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  GraduationCap,
  Image,
  LayoutList,
  Pencil,
  Play,
  Send,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { useClass } from '@/hooks/api/use-class';
import { usePublishClass } from '@/hooks/api/use-classes';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { SLIDE_LABELS } from '@/config/slide.constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const SLIDE_ICONS: Record<string, React.ElementType> = {
  COVER: GraduationCap,
  CONTENT: FileText,
  ACTIVITY: Zap,
  VIDEO: Play,
  IMAGE: Image,
};

// ─── Slides List ──────────────────────────────────────────────────────────────

function SlidesList({
  classId,
  slides,
}: {
  classId: string;
  slides: NonNullable<ReturnType<typeof useClass>['data']>['slides'];
}) {
  if (!slides || slides.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-4 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <LayoutList className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No hay slides aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Usa el editor para crear y diseñar los slides de esta clase.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/classes/${classId}/editor`}>
            <Pencil className="size-4" />
            Abrir editor
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {slides
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((slide) => {
          const Icon = SLIDE_ICONS[slide.type] ?? FileText;
          return (
            <li key={slide.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                {slide.order}
              </span>
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{slide.title}</p>
                <p className="text-xs text-muted-foreground">{SLIDE_LABELS[slide.type] ?? slide.type}</p>
              </div>
              <Badge variant="secondary" appearance="light" size="sm">
                {SLIDE_LABELS[slide.type] ?? slide.type}
              </Badge>
            </li>
          );
        })}
    </ul>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassDetailClient({ id }: { id: string }) {
  const { data: cls, isLoading, isError } = useClass(id);
  const publishMutation = usePublishClass(cls?.courseId ?? '');

  const isDraft = cls?.status?.toUpperCase() === 'DRAFT';

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

  return (
    <div className="container py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="mt-0.5">
          <Link href="/classes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-32 mt-2" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold">{cls?.title ?? 'Clase'}</h1>
                {cls?.status && (
                  <Badge variant={statusVariant(cls.status)} appearance="light">
                    {statusLabel(cls.status)}
                  </Badge>
                )}
              </div>
              {cls?.description && (
                <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
              )}
            </>
          )}
        </div>
        {!isLoading && (
          <Button size="sm" asChild>
            <Link href={`/classes/${id}/editor`}>
              <Pencil className="size-4" />
              Abrir editor
            </Link>
          </Button>
        )}
        {isDraft && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            disabled={publishMutation.isPending}
            onClick={() => {
              publishMutation.mutate(id, {
                onSuccess: () => toast.success('Clase publicada'),
                onError: () => toast.error('Error al publicar la clase'),
              });
            }}
          >
            <Send className="size-4" />
            {publishMutation.isPending ? 'Publicando...' : 'Publicar clase'}
          </Button>
        )}
      </div>

      {/* Class info */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <dl>
              {[
                { label: 'Estado', value: cls?.status ? statusLabel(cls.status) : '—' },
                {
                  label: 'Fecha de creación',
                  value: cls?.createdAt
                    ? new Date(cls.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—',
                },
                {
                  label: 'Total de slides',
                  value: cls?.slides?.length ?? 0,
                },
              ].map((row, i) => (
                <div key={i}>
                  {i > 0 && <Separator />}
                  <div className="flex items-start gap-4 px-5 py-4">
                    <dt className="w-40 shrink-0 text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm flex-1">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Slides — read-only list, managed from editor */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Slides</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/classes/${id}/editor`}>
                <Pencil className="size-4" />
                Gestionar en editor
              </Link>
            </Button>
          </CardToolbar>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <SlidesList classId={id} slides={cls?.slides} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
