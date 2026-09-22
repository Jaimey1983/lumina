import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Desempeño curricular a nivel de CURSO (Etapa J / J6, Entrada 1) — no
 * confundir con `Class.desempeno` (legado, por clase, Pieza 1). Un curso
 * admite varios, uno por cada combinación de componente EBC + competencia
 * ICFES que el docente agregue (J6.1).
 */
export interface DesempenoCurso {
  id: string;
  courseId: string;
  area: string;
  grado: string;
  componenteEbc: string;
  competenciaIcfes: string;
  enunciado: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesempenoCursoInput {
  componenteEbc: string;
  competenciaIcfes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as Record<string, unknown>).data)
  ) {
    return (data as { data: T[] }).data;
  }
  return [];
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useDesempenosCurso(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'desempenos'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get(`/curriculum/courses/${courseId}/desempenos`);
      return normalizeList<DesempenoCurso>(data);
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateDesempenoCurso(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDesempenoCursoInput) => {
      const { data } = await api.post(
        `/curriculum/courses/${courseId}/desempenos`,
        input,
      );
      return data as DesempenoCurso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'desempenos'],
      });
    },
  });
}

export function useDeleteDesempenoCurso(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (desempenoId: string) => {
      await api.delete(
        `/curriculum/courses/${courseId}/desempenos/${desempenoId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'desempenos'],
      });
    },
  });
}
