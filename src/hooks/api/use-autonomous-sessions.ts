import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';

/** Mensaje de Nest/axios (`message` string o array en errores de validación). */
function backendErrorMessage(error: unknown): string | undefined {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  const raw = data?.message;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (Array.isArray(raw) && raw.length) return raw.map(String).join(' ');
  return undefined;
}

/** Comportamiento al expirar el temporizador de slide (contrato backend). */
export type AutonomousTimerBehavior = 'advance' | 'lock';

export interface LaunchAutonomousSessionInput {
  opensAt: string;
  closesAt: string;
  /** `-1` = intentos ilimitados */
  maxAttempts: number;
  allowBackNav: boolean;
  timerBehavior: AutonomousTimerBehavior;
}

export type AutonomousSessionStatus = 'scheduled' | 'open' | 'closed';

export interface AutonomousSession {
  id: string;
  classId: string;
  opensAt: string;
  closesAt: string;
  status: AutonomousSessionStatus;
  maxAttempts: number;
  allowBackNav: boolean;
  timerBehavior: AutonomousTimerBehavior;
  /** PIN de acceso (docente / respuesta de creación). */
  pin?: string | null;
}

export interface UpdateAutonomousSessionInput {
  closesAt: string;
  maxAttempts: number;
  allowBackNav: boolean;
  timerBehavior: AutonomousTimerBehavior;
  /** Incluir solo si la sesión está `scheduled` y se edita la apertura. */
  opensAt?: string;
}

export type PatchAutonomousSessionPayload = { sessionId: string } & UpdateAutonomousSessionInput;

function normalizeList(raw: unknown): AutonomousSession[] {
  if (Array.isArray(raw)) return raw as AutonomousSession[];
  if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: AutonomousSession[] }).data;
  }
  return [];
}

const autonomousSessionsKey = (classId: string) => ['autonomous-sessions', classId] as const;

export function useAutonomousSessions(classId: string) {
  return useQuery({
    queryKey: autonomousSessionsKey(classId),
    enabled: !!classId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.get<unknown>(`/classes/${classId}/autonomous-sessions`);
      return normalizeList(data);
    },
  });
}

export function useLaunchAutonomousSession(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LaunchAutonomousSessionInput) => {
      const { data } = await api.post<AutonomousSession>(`/classes/${classId}/autonomous-sessions`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: autonomousSessionsKey(classId) });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
    onError: (error) => {
      const message =
        backendErrorMessage(error) ?? 'No se pudo lanzar la tarea. Intenta de nuevo.';
      toast.error(message);
    },
  });
}

export function useUpdateAutonomousSession(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, ...body }: PatchAutonomousSessionPayload) => {
      const { data } = await api.patch<AutonomousSession>(`/autonomous-sessions/${sessionId}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: autonomousSessionsKey(classId) });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
    onError: (error) => {
      const message = backendErrorMessage(error) ?? 'No se pudieron guardar los cambios.';
      toast.error(message);
    },
  });
}

export function useCancelAutonomousSession(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/autonomous-sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: autonomousSessionsKey(classId) });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
    onError: (error) => {
      const message = backendErrorMessage(error) ?? 'No se pudo cancelar la tarea.';
      toast.error(message);
    },
  });
}

function formatOpensDayMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

/** Primera sesión con estado `open` o `scheduled` (lista típicamente ordenada por reciente). */
export function getActiveAutonomousSession(
  sessions: AutonomousSession[] | undefined | null,
): AutonomousSession | null {
  const list = sessions ?? [];
  const active = list.filter((s) => s.status === 'open' || s.status === 'scheduled');
  return active[0] ?? null;
}

export type AutonomousActionBadgeKind = 'scheduled' | 'open' | null;

export function getAutonomousActionBadge(active: AutonomousSession | null): {
  kind: AutonomousActionBadgeKind;
  label: string;
} {
  if (!active) return { kind: null, label: '' };
  const now = Date.now();

  if (active.status === 'scheduled') {
    return { kind: 'scheduled', label: `Programada · Abre ${formatOpensDayMonth(active.opensAt)}` };
  }

  if (active.status === 'open') {
    const closes = new Date(active.closesAt).getTime();
    const ms = Math.max(0, closes - now);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 72) return { kind: 'open', label: `Abierta · Cierra el ${formatOpensDayMonth(active.closesAt)}` };
    if (h >= 1) return { kind: 'open', label: `Abierta · Cierra en ${h}h` };
    if (m >= 1) return { kind: 'open', label: `Abierta · Cierra en ${m} min` };
    return { kind: 'open', label: 'Abierta · Cierra pronto' };
  }

  return { kind: null, label: '' };
}
