import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<ApiUser>>('/users');
      return response.data;
    },
  });
}
