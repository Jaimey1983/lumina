'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, ClipboardList } from 'lucide-react';

import { useCourses } from '@/hooks/api/use-courses';
import { PageBanner } from '@/components/ui/page-banner';

import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const courseCardShell =
  'overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-[#ffffff] shadow-[0px_2px_6px_rgba(0,0,0,0.06)]';

function CourseCardSkeleton() {
  return (
    <Card className={cn(courseCardShell)}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </Card>
  );
}

export function EduHomeClient() {
  const { data: courses = [], isLoading, isError } = useCourses();

  return (
    <div className="w-full flex flex-col gap-0 pb-6">
      <PageBanner
        title="Lumina Edu"
        subtitle="Planilla institucional de notas · escala 1.0 a 5.0"
        backHref="/dashboard"
      />
      <div className="space-y-6 px-6 pt-4">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Cursos del docente</h2>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {isError ? (
            <Alert variant="destructive">
              <AlertIcon>
                <ClipboardList className="size-4" />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>No se pudieron cargar los cursos para Lumina Edu.</AlertTitle>
              </AlertContent>
            </Alert>
          ) : null}

          {!isLoading && !isError && courses.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                <BookOpen className="size-9 text-muted-foreground/70" />
                <div className="space-y-1">
                  <h3 className="font-medium">No hay cursos disponibles</h3>
                  <p className="text-sm text-muted-foreground">
                    Cuando tengas cursos asignados apareceran aqui con acceso directo a su planilla.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && !isError && courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className={cn(courseCardShell)}>
                  <div className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#111827]">
                        {course.name}
                      </h3>
                      {course.isActive ? (
                        <span className="shrink-0 rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#16a34a]">
                          Activo
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#9ca3af]">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280]">{course.code}</p>
                    <p className="text-sm text-[#6b7280]">
                      Promedio final, escala de valoración y captura rapida por actividad en una sola vista.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/edu/${course.id}`}
                        className="flex w-full items-center justify-between rounded-md bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                      >
                        Abrir planilla
                        <ChevronRight className="size-4 shrink-0" aria-hidden />
                      </Link>
                      <Link
                        href={`/edu/${course.id}/progress`}
                        className="flex w-full items-center justify-between rounded-md border border-[#2563EB]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-[#eff6ff]"
                      >
                        Mapa de progreso
                        <ChevronRight className="size-4 shrink-0" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
