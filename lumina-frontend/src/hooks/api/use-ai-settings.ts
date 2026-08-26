import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AiProviderId = 'GEMINI' | 'OPENAI' | 'CLAUDE';

export interface AiProviderStatus {
  provider: AiProviderId;
  label: string;
  configured: boolean;
  keyHint: string | null;
  lastVerifiedAt: string | null;
}

export interface AiSettings {
  preferredProvider: AiProviderId | null;
  resolvedProvider: AiProviderId | null;
  resolvedSource: 'byok' | 'platform' | null;
  platformFallbackAvailable: boolean;
  encryptionReady: boolean;
  providers: AiProviderStatus[];
}

const QUERY_KEY = ['ai', 'settings'] as const;

const AI_STAFF_ROLES = new Set([
  'ADMIN',
  'SUPERADMIN',
  'TEACHER',
  'TEACHER_ASSISTANT',
  'DEPARTMENT_HEAD',
]);

export function isAiStaffRole(role?: string | null): boolean {
  return Boolean(role && AI_STAFF_ROLES.has(role.toUpperCase()));
}

export function useAiSettings(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY,
    enabled,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<AiSettings>('/ai/settings');
      return data;
    },
  });
}

function useAiSettingsMutation<TArg>(
  fn: (arg: TArg) => Promise<AiSettings>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
    },
  });
}

export function useSaveAiKey() {
  return useAiSettingsMutation(
    async (input: { provider: AiProviderId; apiKey: string }) => {
      const { data } = await api.put<AiSettings>(
        `/ai/settings/keys/${input.provider}`,
        { apiKey: input.apiKey },
      );
      return data;
    },
  );
}

export function useDeleteAiKey() {
  return useAiSettingsMutation(async (provider: AiProviderId) => {
    const { data } = await api.delete<AiSettings>(
      `/ai/settings/keys/${provider}`,
    );
    return data;
  });
}

export function useSetPreferredAiProvider() {
  return useAiSettingsMutation(async (preferredProvider: AiProviderId) => {
    const { data } = await api.patch<AiSettings>('/ai/settings', {
      preferredProvider,
    });
    return data;
  });
}

export function useTestAiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { provider: AiProviderId; apiKey?: string }) => {
      const { data } = await api.post<{ ok: true; provider: AiProviderId }>(
        `/ai/settings/keys/${input.provider}/test`,
        input.apiKey ? { apiKey: input.apiKey } : {},
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
