import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

/** Actividad evaluable asociada a un slide (respuesta del GET gradebook por clase). */
export interface ClassGradebookActividad {
  slideId: string;
  activityType: string;
  esManual?: boolean;
}

/** Estudiante con notas por slideId y nota final opcional. */
export interface ClassGradebookEstudiante {
  studentId: string;
  nombre?: string;
  name?: string;
  email?: string;
  notaFinal?: number | null;
  /** Nota en escala 1.0–5.0 por slideId, o null si no aplica. */
  notas?: Record<string, number | null | undefined>;
}

export interface ClassGradebookData {
  actividades: ClassGradebookActividad[];
  estudiantes: ClassGradebookEstudiante[];
}

function unwrapEnvelope(data: unknown): ClassGradebookData {
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (inner && typeof inner === 'object') {
      return inner as ClassGradebookData;
    }
  }
  return data as ClassGradebookData;
}

/**
 * GET /classes/:id/gradebook — planilla de la clase (actividades + estudiantes).
 */
export function useGradebook(classId: string | undefined) {
  return useQuery({
    queryKey: ['gradebook', classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await api.get<unknown>(`/classes/${classId}/gradebook`);
      const body = unwrapEnvelope(data);
      return {
        actividades: Array.isArray(body.actividades) ? body.actividades : [],
        estudiantes: Array.isArray(body.estudiantes) ? body.estudiantes : [],
      };
    },
  });
}
