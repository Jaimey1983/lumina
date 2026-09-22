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

/** Entrada 2 (J6.3) — camino DBA: unidad curada + sus evidencias de aprendizaje. */
export interface UnidadDbaParaClase {
  unidadId: number;
  titulo: string;
  evidenciasAprendizaje: string[];
  /** Temas/subtemas reales de la unidad (J6.4) — sugeridos en la Entrada 3. */
  temas: string[];
  subtemas: string[];
}

/** Camino curricular EXCLUYENTE (J6, "Decisiones cerradas"): nunca los dos a la vez. */
export type CaminoCurricular = 'dba' | 'ebc';

export interface DbaSeleccionado {
  unidadId: number;
  evidenciasElegidas: string[];
}

export interface EbcSeleccionado {
  subprocesosElegidos: string[];
}

export interface IndicadoresClase {
  cognitivo: string[];
  procedimental: string[];
  actitudinal: string[];
}

export interface GenerarIndicadoresClaseInput {
  caminoCurricular: CaminoCurricular;
  dbaSeleccionado?: DbaSeleccionado;
  ebcSeleccionado?: EbcSeleccionado;
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

// ─── Entrada 2 (Etapa J / J6.3) — camino DBA/EBC + indicadores de clase ────────

export function useUnidadesDbaParaDesempeno(
  courseId: string,
  desempenoId: string | null,
) {
  return useQuery({
    queryKey: ['courses', courseId, 'desempenos', desempenoId, 'unidades-dba'],
    enabled: !!courseId && !!desempenoId,
    queryFn: async () => {
      const { data } = await api.get(
        `/curriculum/courses/${courseId}/desempenos/${desempenoId}/unidades-dba`,
      );
      return normalizeList<UnidadDbaParaClase>(data);
    },
  });
}

export function useSubprocesosEbcParaDesempeno(
  courseId: string,
  desempenoId: string | null,
) {
  return useQuery({
    queryKey: [
      'courses',
      courseId,
      'desempenos',
      desempenoId,
      'subprocesos-ebc',
    ],
    enabled: !!courseId && !!desempenoId,
    queryFn: async () => {
      const { data } = await api.get<string[]>(
        `/curriculum/courses/${courseId}/desempenos/${desempenoId}/subprocesos-ebc`,
      );
      return data ?? [];
    },
  });
}

export function useGenerarIndicadoresClase(
  courseId: string,
  desempenoId: string | null,
) {
  return useMutation({
    mutationFn: async (input: GenerarIndicadoresClaseInput) => {
      const { data } = await api.post<IndicadoresClase>(
        `/curriculum/courses/${courseId}/desempenos/${desempenoId}/generar-indicadores`,
        input,
      );
      return data;
    },
  });
}
