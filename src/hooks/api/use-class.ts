import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Slide {
  id: string;
  order: number;
  type: 'COVER' | 'CONTENT' | 'ACTIVITY' | 'VIDEO' | 'IMAGE';
  title: string;
  content?: unknown;
}

export interface ClassDetail {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  codigo?: string;
  status: string;
  createdAt: string;
  slides?: Slide[];
  desempeno?: unknown;
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', 'detail', id],
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data } = await api.get<ClassDetail>(`/classes/${id}`);
      return data ?? null;
    },
  });
}
