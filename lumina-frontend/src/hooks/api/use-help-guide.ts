import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * "Guía de Lumina" (X.2) — clase de sistema de solo lectura. Deliberadamente
 * NO reusa `useClass(id)` (`/classes/:id`): esa ruta rechaza con 403 a
 * cualquier docente que no sea el SUPERADMIN dueño de la clase de sistema
 * (`ClassesService.findOne`, chequeo de propiedad para clases sin curso).
 * `GET /help/guide` es su propia ruta de lectura, sin ese chequeo.
 */
export interface HelpGuideSlide {
  id: string;
  order: number;
  type: 'COVER' | 'CONTENT' | 'ACTIVITY' | 'VIDEO' | 'IMAGE';
  title: string;
  content?: unknown;
  contentVersion?: number;
}

export interface HelpGuide {
  id: string;
  title: string;
  description?: string | null;
  background?: string | null;
  templateVersion: number | null;
  slides: HelpGuideSlide[];
  /** `null` si el docente actual todavía no cerró la tarjeta del dashboard. */
  dismissedAt: string | null;
}

export function useHelpGuide(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['help-guide'],
    enabled: options?.enabled,
    queryFn: async () => {
      const { data } = await api.get<HelpGuide>('/help/guide');
      return data;
    },
    // No pierde valor por refetch agresivo — es contenido de solo lectura, casi estático.
    staleTime: 5 * 60 * 1000,
  });
}

export function useDuplicateHelpGuide() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ id: string; title: string }>(
        '/help/guide/duplicate',
      );
      return data;
    },
  });
}

export function useDismissHelpGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/help/guide/dismiss');
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData<HelpGuide | undefined>(['help-guide'], (prev) =>
        prev ? { ...prev, dismissedAt: new Date().toISOString() } : prev,
      );
    },
  });
}
