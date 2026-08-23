import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SlideVersion {
  id: string;
  slideId: string;
  content: unknown;
  createdAt: string;
}

export function slideVersionsQueryKey(classId: string, slideId: string | undefined) {
  return ['classes', classId, 'slides', slideId ?? '', 'versions'] as const;
}

export function useSlideVersions(classId: string, slideId: string | undefined) {
  return useQuery({
    queryKey: [...slideVersionsQueryKey(classId, slideId)],
    enabled: !!classId && !!slideId,
    queryFn: async () => {
      const { data } = await api.get<SlideVersion[]>(
        `/classes/${classId}/slides/${slideId}/versions`,
      );
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useCreateSlideVersion(classId: string, slideId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content }: { content: unknown }) => {
      if (!slideId) throw new Error('slideId requerido');
      const { data } = await api.post<SlideVersion>(
        `/classes/${classId}/slides/${slideId}/versions`,
        { content },
      );
      return data;
    },
    onSuccess: () => {
      if (slideId) {
        queryClient.invalidateQueries({
          queryKey: [...slideVersionsQueryKey(classId, slideId)],
        });
      }
    },
  });
}

export function useRestoreSlideVersion(classId: string, slideId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      if (!slideId) throw new Error('slideId requerido');
      const { data } = await api.post(
        `/classes/${classId}/slides/${slideId}/versions/${versionId}/restore`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
      if (slideId) {
        queryClient.invalidateQueries({
          queryKey: [...slideVersionsQueryKey(classId, slideId)],
        });
      }
    },
  });
}
