'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, ClipboardList } from 'lucide-react';

import { useCourses } from '@/hooks/api/use-courses';

import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function CourseCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardHeading className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </CardHeading>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-36" />
      </CardContent>
    </Card>
  );
}

export function EduHomeClient() {
  const { data: courses = [], isLoading, isError } = useCourses();

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl border border-border bg-linear-to-br from-slate-50 via-white to-blue-50 p-6 shadow-xs dark:from-slate-950 dark:via-background dark:to-blue-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="primary" appearance="outline" className="w-fit">
              Lumina Edu
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">Planilla institucional de notas</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Accede a la planilla de cada curso, registra notas en escala colombiana y revisa el promedio final con su nivel de desempeno.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-sm shadow-xs dark:border-blue-950 dark:bg-background/80">
            <ClipboardList className="size-4 text-blue-600" />
            <span className="text-muted-foreground">
              Escala oficial: <span className="font-medium text-foreground">1.0 a 5.0</span>
            </span>
          </div>
        </div>
      </section>

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
              <Card key={course.id} className="overflow-hidden">
                <CardHeader>
                  <CardHeading className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="leading-snug">{course.name}</CardTitle>
                      <Badge
                        variant={course.isActive ? 'success' : 'secondary'}
                        appearance="light"
                      >
                        {course.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                  </CardHeading>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Promedio final, escala colombiana y captura rapida por actividad en una sola vista.
                  </div>
                  <Button asChild className="w-full justify-between">
                    <Link href={`/edu/${course.id}`}>
                      Abrir planilla
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}