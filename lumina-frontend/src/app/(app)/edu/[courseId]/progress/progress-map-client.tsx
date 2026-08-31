'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GitBranch, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { PageBanner } from '@/components/ui/page-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useCourse } from '@/hooks/api/use-course';
import {
  useMarkClassProgress,
  useProgressMap,
  useUpdateProgressEdges,
} from '@/hooks/api/use-progress-map';
import type { GraphConnectAttempt } from '@/lib/graph-editor';
import {
  progressMapToGraphModel,
  progressStatusLabel,
  type ProgressMapNode,
} from '@/lib/progress-map';
import { cn } from '@/lib/utils';

const GraphCanvas = dynamic(
  () => import('@/lib/graph-editor').then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />,
  },
);

export function ProgressMapClient({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const isStaff = user?.role !== 'STUDENT';
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const studentQuery = isStaff ? selectedStudentId || null : user?.id ?? null;
  const { data: course } = useCourse(courseId);
  const { data, isLoading, isError } = useProgressMap(courseId, studentQuery);
  const mark = useMarkClassProgress(courseId);
  const updateEdges = useUpdateProgressEdges(courseId);

  const model = useMemo(() => (data ? progressMapToGraphModel(data) : { nodes: [], edges: [] }), [data]);
  const selectedNode: ProgressMapNode | undefined = data?.nodes.find(
    (n) => n.classId === selectedClassId,
  );

  const handleConnect = (attempt: GraphConnectAttempt) => {
    if (!isStaff || !data) return;
    const exists = data.edges.some(
      (e) => e.fromClassId === attempt.source && e.toClassId === attempt.target,
    );
    if (exists) return;
    updateEdges.mutate(
      [...data.edges, { fromClassId: attempt.source, toClassId: attempt.target }],
      { onError: () => toast.error('No se pudo guardar la conexión') },
    );
  };

  const handleMark = (completed: boolean) => {
    if (!selectedClassId || !studentQuery) return;
    mark.mutate(
      { classId: selectedClassId, userId: studentQuery, completed },
      {
        onSuccess: () => toast.success(completed ? 'Clase marcada como completada' : 'Marca retirada'),
        onError: () => toast.error('No se pudo actualizar el progreso'),
      },
    );
  };

  return (
    <div className="flex w-full flex-col gap-0 pb-6">
      <PageBanner
        title="Mapa de progreso"
        subtitle={`${course?.name ?? 'Curso'} · camino del estudiante`}
        backHref={`/edu/${courseId}`}
        backLabel="Volver a la planilla"
        action={
          <Link
            href={`/edu/${courseId}`}
            className="rounded-lg border border-white/50 bg-transparent px-4 py-1.5 text-[0.75rem] font-extrabold text-white hover:bg-white/10"
          >
            Planilla
          </Link>
        }
      />

      <div className="space-y-4 px-6 pt-4">
        {isStaff ? (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-[#6b7280]">
              Estudiante
              <select
                className="ml-2 h-8 rounded-md border border-[#e5e7eb] bg-white px-2 text-sm text-[#111827]"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setSelectedClassId(null);
                }}
              >
                <option value="">Vista general del curso</option>
                {(data?.students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.lastName}
                  </option>
                ))}
              </select>
            </label>
            {data?.edgesCustom ? (
              <button
                type="button"
                className="h-8 rounded-md border border-[#e5e7eb] px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
                onClick={() =>
                  updateEdges.mutate(null, {
                    onSuccess: () => toast.success('Orden automático restaurado'),
                    onError: () => toast.error('No se pudo restaurar el orden'),
                  })
                }
              >
                Restaurar orden automático
              </button>
            ) : (
              <span className="text-xs text-[#6b7280]">
                Orden automático por fecha de creación. Conecta nodos para personalizar.
              </span>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-[11px] text-[#6b7280]">
          <Legend color="#9CA3AF" label="Bloqueado" />
          <Legend color="#2563EB" label="Disponible" />
          <Legend color="#D97706" label="En progreso" />
          <Legend color="#059669" label="Completado" />
        </div>

        {isLoading ? <Skeleton className="h-[420px] w-full rounded-lg" /> : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertIcon>
              <Lock className="size-4" />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>No se pudo cargar el mapa de progreso.</AlertTitle>
            </AlertContent>
          </Alert>
        ) : null}

        {!isLoading && !isError && data && data.nodes.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white text-center">
            <GitBranch className="size-8 text-muted-foreground/70" />
            <p className="text-sm text-[#6b7280]">Este curso aún no tiene clases publicadas.</p>
          </div>
        ) : null}

        {!isLoading && !isError && data && data.nodes.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
            <GraphCanvas
              model={model}
              interactive={isStaff}
              positionAuthority="model"
              onNodeSelect={setSelectedClassId}
              onPaneClick={() => setSelectedClassId(null)}
              onConnect={isStaff ? handleConnect : undefined}
              fitView
              minHeight={420}
              showControls
              showMiniMap={false}
              showBackground
            />
          </div>
        ) : null}

        {selectedNode ? (
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm">
            <p className="font-semibold text-[#111827]">{selectedNode.title}</p>
            <p className="mt-1 text-xs text-[#6b7280]">
              {progressStatusLabel(selectedNode.status)}
              {selectedNode.source ? ` · vía ${selectedNode.source}` : ''}
            </p>
            {isStaff && studentQuery ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={mark.isPending || selectedNode.status === 'completed'}
                  onClick={() => handleMark(true)}
                  className={cn(
                    'inline-flex h-8 items-center rounded-md bg-[#2563EB] px-3 text-xs font-semibold text-white',
                    (mark.isPending || selectedNode.status === 'completed') && 'opacity-50',
                  )}
                >
                  {mark.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                  Marcar completada
                </button>
                <button
                  type="button"
                  disabled={mark.isPending}
                  onClick={() => handleMark(false)}
                  className="h-8 rounded-md border border-[#e5e7eb] px-3 text-xs font-medium text-[#374151]"
                >
                  Quitar marca
                </button>
              </div>
            ) : null}
            {isStaff && studentQuery ? (
              <p className="mt-2 text-xs text-[#6b7280]">
                Quitar marca solo borra el override docente. Si hay sesión live cerrada o
                autónomo completado, el nodo sigue completado.
              </p>
            ) : null}
            {isStaff && !studentQuery ? (
              <p className="mt-2 text-xs text-[#6b7280]">
                Elige un estudiante para marcar su progreso. En vista general:{' '}
                {selectedNode.completedCount ?? 0}/{selectedNode.enrolledCount ?? 0} completaron.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
