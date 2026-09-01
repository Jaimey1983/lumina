import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'REJECTED'
  | null;

export interface AdminUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  deletedAt: string | null;
  institution: string | null;
  createdAt: string;
  verificationStatus: VerificationStatus;
  verificationMethod: string | null;
  verificationExpiresAt: string | null;
  institutionalEmail: string | null;
}

export interface AdminUserDetail extends AdminUser {
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: { id: string; name: string; lastName: string } | null;
  _count: {
    teacherCourses: number;
    classResults: number;
    enrollments: number;
    teacherAiKeys: number;
    studentBadges: number;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AdminUsersFilters {
  search?: string;
  role?: string;
  verificationStatus?: string;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

export interface InvitationCode {
  id: string;
  code: string;
  targetRole: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  note: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string; lastName: string } | null;
  usedBy?: { id: string; name: string; lastName: string; email: string } | null;
}

export interface TrustedDomain {
  id: string;
  domain: string;
  autoVerify: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  admin: { id: string; name: string; lastName: string; email: string } | null;
  targetUser: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  } | null;
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

const adminKeys = {
  users: (f: AdminUsersFilters) => ['admin', 'users', f] as const,
  user: (id: string) => ['admin', 'users', id] as const,
  invitationCodes: ['admin', 'invitation-codes'] as const,
  trustedDomains: ['admin', 'trusted-domains'] as const,
  auditLogs: (f: Record<string, unknown>) => ['admin', 'audit-logs', f] as const,
};

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.verificationStatus)
        params.verificationStatus = filters.verificationStatus;
      if (filters.includeDeleted) params.includeDeleted = 'true';
      if (filters.onlyDeleted) params.onlyDeleted = 'true';
      params.page = filters.page ?? 1;
      params.pageSize = filters.pageSize ?? 25;
      const { data } = await api.get<Paginated<AdminUser>>('/superadmin/users', {
        params,
      });
      return data;
    },
  });
}

export function useAdminUserDetail(id: string | null) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<AdminUserDetail>(
        `/superadmin/users/${id}`,
      );
      return data;
    },
  });
}

type UserAction =
  | { kind: 'suspend' | 'reactivate' | 'softDelete' | 'restore' | 'resetPassword' | 'verify' }
  | { kind: 'reject'; reason: string };

export function useAdminUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: UserAction }) => {
      const base = `/superadmin/users/${id}`;
      switch (action.kind) {
        case 'suspend':
          return (await api.patch(`${base}/suspend`)).data;
        case 'reactivate':
          return (await api.patch(`${base}/reactivate`)).data;
        case 'softDelete':
          return (await api.delete(base)).data;
        case 'restore':
          return (await api.post(`${base}/restore`)).data;
        case 'resetPassword':
          return (await api.post<{ temporaryPassword: string }>(
            `${base}/reset-password`,
          )).data;
        case 'verify':
          return (await api.post(`${base}/verify`)).data;
        case 'reject':
          return (await api.post(`${base}/reject`, { reason: action.reason }))
            .data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ─── Impersonación ────────────────────────────────────────────────────────────

const ADMIN_TOKEN_KEY = 'lumina_admin_token';

export function useImpersonate() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post<{
        token: string;
        expiresInSeconds: number;
        target: { id: string; name: string; lastName: string; email: string };
      }>(`/superadmin/users/${userId}/impersonate`);
      return data;
    },
    onSuccess: (data) => {
      const current = localStorage.getItem('token');
      if (current) sessionStorage.setItem(ADMIN_TOKEN_KEY, current);
      localStorage.setItem('token', data.token);
      // Recarga completa para reconstruir el estado de auth como el usuario impersonado.
      window.location.href = '/dashboard';
    },
  });
}

// ─── Códigos de invitación ────────────────────────────────────────────────────

export function useInvitationCodes() {
  return useQuery({
    queryKey: adminKeys.invitationCodes,
    queryFn: async () => {
      const { data } = await api.get<InvitationCode[]>(
        '/superadmin/invitation-codes',
      );
      return data;
    },
  });
}

export function useCreateInvitationCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      note?: string;
      maxUses?: number;
      expiresInDays?: number;
      targetRole?: string;
    }) => {
      const { data } = await api.post<InvitationCode>(
        '/superadmin/invitation-codes',
        input,
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.invitationCodes }),
  });
}

export function useRevokeInvitationCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/superadmin/invitation-codes/${id}/revoke`)).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.invitationCodes }),
  });
}

// ─── Dominios de confianza ────────────────────────────────────────────────────

export function useTrustedDomains() {
  return useQuery({
    queryKey: adminKeys.trustedDomains,
    queryFn: async () => {
      const { data } = await api.get<TrustedDomain[]>(
        '/superadmin/trusted-domains',
      );
      return data;
    },
  });
}

export function useCreateTrustedDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { domain: string; autoVerify?: boolean }) => {
      const { data } = await api.post<TrustedDomain>(
        '/superadmin/trusted-domains',
        input,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.trustedDomains }),
  });
}

export function useDeleteTrustedDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(`/superadmin/trusted-domains/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.trustedDomains }),
  });
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

export function useAuditLogs(filters: {
  action?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.auditLogs(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 50,
      };
      if (filters.action) params.action = filters.action;
      const { data } = await api.get<Paginated<AuditLog>>(
        '/superadmin/audit-logs',
        { params },
      );
      return data;
    },
  });
}
