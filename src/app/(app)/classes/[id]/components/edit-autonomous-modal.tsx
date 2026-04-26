'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCancelAutonomousSession,
  useUpdateAutonomousSession,
  type AutonomousSession,
  type AutonomousTimerBehavior,
  type PatchAutonomousSessionPayload,
} from '@/hooks/api/use-autonomous-sessions';

import {
  DateTimeField,
  fieldLabel,
  formatDayMonth,
  formatTimeAmPm,
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from './launch-autonomous-modal';

export interface EditAutonomousModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  session: AutonomousSession;
  classCode: string;
}

const STATUS_LABEL: Record<AutonomousSession['status'], string> = {
  scheduled: 'Programada',
  open: 'Abierta',
  closed: 'Cerrada',
};

function statusBadgeStyle(status: AutonomousSession['status']): { bg: string; text: string } {
  if (status === 'scheduled') return { bg: '#fef3c7', text: '#d97706' };
  if (status === 'open') return { bg: '#dcfce7', text: '#16a34a' };
  return { bg: '#f3f4f6', text: '#6b7280' };
}

export function EditAutonomousModal({
  open,
  onOpenChange,
  classId,
  session,
  classCode,
}: EditAutonomousModalProps) {
  const [closesLocal, setClosesLocal] = useState('');
  const [opensLocal, setOpensLocal] = useState('');
  const [maxAttemptsChoice, setMaxAttemptsChoice] = useState<1 | 2 | 3 | 'unlimited'>(1);
  const [allowBackNav, setAllowBackNav] = useState(false);
  const [timerBehavior, setTimerBehavior] = useState<AutonomousTimerBehavior>('advance');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const updateMutation = useUpdateAutonomousSession(classId);
  const cancelMutation = useCancelAutonomousSession(classId);

  const onClose = () => onOpenChange(false);

  useEffect(() => {
    if (!open) {
      setConfirmCancel(false);
      return;
    }
    const opens = new Date(session.opensAt);
    const closes = new Date(session.closesAt);
    setOpensLocal(toDatetimeLocalValue(opens));
    setClosesLocal(toDatetimeLocalValue(closes));
    setMaxAttemptsChoice(
      session.maxAttempts === -1
        ? 'unlimited'
        : session.maxAttempts === 2
          ? 2
          : session.maxAttempts === 3
            ? 3
            : 1,
    );
    setAllowBackNav(session.allowBackNav);
    setTimerBehavior(session.timerBehavior === 'lock' ? 'lock' : 'advance');
    updateMutation.reset();
    cancelMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicio al abrir / cambiar sesión
  }, [open, session.id, session.opensAt, session.closesAt, session.maxAttempts, session.allowBackNav, session.timerBehavior]);

  const opensDate = useMemo(() => parseDatetimeLocal(opensLocal), [opensLocal]);
  const closesDate = useMemo(() => parseDatetimeLocal(closesLocal), [closesLocal]);

  const canEditOpens = session.status === 'scheduled';

  const handleSave = () => {
    if (!closesDate) {
      toast.error('Indica fecha y hora de cierre.');
      return;
    }
    const refOpens = canEditOpens && opensDate ? opensDate : new Date(session.opensAt);
    if (closesDate <= refOpens) {
      toast.error('El cierre debe ser posterior a la apertura.');
      return;
    }

    const payload: PatchAutonomousSessionPayload = {
      sessionId: session.id,
      closesAt: closesDate.toISOString(),
      maxAttempts: maxAttemptsChoice === 'unlimited' ? -1 : maxAttemptsChoice,
      allowBackNav,
      timerBehavior,
    };
    if (canEditOpens && opensDate) {
      payload.opensAt = opensDate.toISOString();
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Cambios guardados');
        onClose();
      },
    });
  };

  const handleCancelTask = async () => {
    try {
      await cancelMutation.mutateAsync(session.id);
      toast.success('Tarea cancelada correctamente');
      setConfirmCancel(false);
      onClose();
    } catch {
      // Errores: toast en useCancelAutonomousSession
    }
  };

  const opensReadOnly = new Date(session.opensAt);
  const badge = statusBadgeStyle(session.status);
  const pinDisplay = session.pin != null && session.pin !== '' ? session.pin : '—';

  const studentLink = useMemo(
    () =>
      typeof window !== 'undefined' ? `${window.location.origin}/autonomo/${session.id}` : '',
    [session.id],
  );

  const copyStudentLink = async () => {
    if (!studentLink) return;
    try {
      await navigator.clipboard.writeText(studentLink);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const copyPin = async () => {
    const pin = session.pin;
    if (pin == null || pin === '') {
      toast.error('No hay PIN disponible');
      return;
    }
    try {
      await navigator.clipboard.writeText(pin);
      toast.success('PIN copiado');
    } catch {
      toast.error('No se pudo copiar el PIN');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] border border-[#e5e7eb] bg-[#ffffff] rounded-lumina-xl shadow-lumina-lg text-[#111827] gap-0 p-0 sm:rounded-lumina-xl sm:max-w-[480px]">
        <DialogHeader className="px-6 pt-6 pb-2 mb-0 text-left">
          <DialogTitle className="text-lumina-lg font-extrabold text-[#111827] tracking-tight">
            Editar tarea autónoma
          </DialogTitle>
          <p className="text-lumina-sm text-[#6b7280] pt-1">Ajusta ventana, intentos y comportamiento.</p>
        </DialogHeader>

        <DialogBody className="px-6 pb-2 max-h-[min(70vh,560px)] overflow-y-auto">
          <div className="space-y-4">
            <div className="rounded-lumina-lg border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
              <div>
                <span className="block text-lumina-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1.5">
                  PIN actual
                </span>
                <div className="w-full rounded-lumina-lg bg-[#f3f4f6] px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-[#111827]">
                  {pinDisplay}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lumina-sm text-[#6b7280]">Estado:</span>
                <span
                  className="inline-flex items-center rounded-lumina-md px-2.5 py-0.5 text-lumina-xs font-bold"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {STATUS_LABEL[session.status]}
                </span>
              </div>
            </div>

            <div className="rounded-lumina-lg border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
              <span className="block text-lumina-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Enlace para estudiantes
              </span>
              <div className="rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-3 py-2.5 font-mono text-lumina-sm break-all text-[#111827]">
                {studentLink || '—'}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={copyStudentLink}
                  disabled={!studentLink}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb] disabled:opacity-50"
                >
                  <ClipboardCopy className="size-4 text-[#2563EB]" />
                  Copiar link
                </button>
                <button
                  type="button"
                  onClick={copyPin}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
                >
                  <ClipboardCopy className="size-4 text-[#2563EB]" />
                  Copiar PIN
                </button>
              </div>
            </div>

            <div>
              {fieldLabel('Apertura')}
              {canEditOpens ? (
                <DateTimeField id="edit-opens" value={opensLocal} onChange={setOpensLocal} />
              ) : (
                <div className="space-y-1">
                  <p className="text-lumina-sm font-medium text-[#111827]">
                    {formatDayMonth(opensReadOnly)} · {formatTimeAmPm(opensReadOnly)}
                  </p>
                  <p className="text-lumina-xs text-[#6b7280] leading-snug">
                    (La tarea ya está abierta, no se puede cambiar la fecha de apertura)
                  </p>
                </div>
              )}
            </div>

            <div>
              {fieldLabel('Cierre')}
              <DateTimeField
                id="edit-closes"
                value={closesLocal}
                onChange={setClosesLocal}
                min={canEditOpens ? opensLocal : toDatetimeLocalValue(new Date(session.opensAt))}
              />
            </div>

            <div>
              {fieldLabel('Intentos')}
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxAttemptsChoice(n)}
                    className={`min-w-[44px] rounded-lumina-md border px-3 py-2 text-lumina-sm font-semibold transition-colors ${
                      maxAttemptsChoice === n
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#e5e7eb] bg-[#ffffff] text-[#111827] hover:bg-[#f9fafb]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMaxAttemptsChoice('unlimited')}
                  className={`rounded-lumina-md border px-3 py-2 text-lumina-sm font-semibold transition-colors ${
                    maxAttemptsChoice === 'unlimited'
                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                      : 'border-[#e5e7eb] bg-[#ffffff] text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                >
                  Ilimitados
                </button>
              </div>
            </div>

            <div>
              {fieldLabel('Permitir volver a slides anteriores')}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAllowBackNav(true)}
                  className={`flex-1 rounded-lumina-md border py-2 text-lumina-sm font-semibold ${
                    allowBackNav
                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                      : 'border-[#e5e7eb] bg-[#ffffff] text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setAllowBackNav(false)}
                  className={`flex-1 rounded-lumina-md border py-2 text-lumina-sm font-semibold ${
                    !allowBackNav
                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                      : 'border-[#e5e7eb] bg-[#ffffff] text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              {fieldLabel('Al expirar el temporizador')}
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lumina-md border border-[#e5e7eb] p-3 hover:bg-[#f9fafb]">
                  <input
                    type="radio"
                    name="edit-timer-expire"
                    checked={timerBehavior === 'advance'}
                    onChange={() => setTimerBehavior('advance')}
                    className="mt-0.5 size-4 accent-[#2563EB]"
                  />
                  <span className="text-lumina-sm text-[#111827]">Avanzar automáticamente</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lumina-md border border-[#e5e7eb] p-3 hover:bg-[#f9fafb]">
                  <input
                    type="radio"
                    name="edit-timer-expire"
                    checked={timerBehavior === 'lock'}
                    onChange={() => setTimerBehavior('lock')}
                    className="mt-0.5 size-4 accent-[#2563EB]"
                  />
                  <span className="text-lumina-sm text-[#111827]">Bloquear respuesta</span>
                </label>
              </div>
            </div>

            <p className="text-lumina-xs text-[#6b7280]">
              Código de clase (referencia): <span className="font-mono font-semibold text-[#111827]">{classCode}</span>
            </p>

            {confirmCancel ? (
              <div className="rounded-lumina-lg border border-[#e5e7eb] bg-[#ffffff] p-4 space-y-3">
                <p className="text-lumina-sm font-semibold text-[#111827]">
                  ¿Seguro? Esta acción no se puede deshacer
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    disabled={cancelMutation.isPending}
                    onClick={handleCancelTask}
                    className="flex-1 rounded-lumina-md bg-[#f87171] px-4 py-2 text-lumina-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? 'Cancelando…' : 'Confirmar cancelación'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogBody>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-[#e5e7eb] flex-col gap-2">
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={handleSave}
            className="w-full rounded-lumina-md bg-[#2563EB] px-4 py-2.5 text-lumina-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {session.status === 'scheduled' && !confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="w-full rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
            >
              Cancelar tarea
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
          >
            Cerrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
