import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UpdateProfileInput {
  name: string;
  lastName: string;
  institution?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function useUpdateProfile(userId: string) {
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data } = await api.patch(`/users/${userId}`, input);
      return data;
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const { data } = await api.patch('/auth/change-password', input);
      return data;
    },
  });
}
