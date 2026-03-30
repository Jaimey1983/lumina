import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiUser {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  role: string;
  institution?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<ApiUser> | ApiUser[]>('/users');
      if (Array.isArray(response)) return response;
      return (response as PaginatedResponse<ApiUser>).data ?? [];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  institution?: string;
}

export interface UpdateUserInput {
  name?: string;
  lastName?: string;
  institution?: string;
  role?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data } = await api.post<ApiUser>('/auth/register', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { data } = await api.patch<ApiUser>(`/users/${userId}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data } = await api.patch<ApiUser>(`/users/${userId}`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
