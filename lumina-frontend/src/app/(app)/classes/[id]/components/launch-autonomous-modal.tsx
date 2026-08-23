'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, Rocket } from 'lucide-react';
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
  useLaunchAutonomousSession,
  type AutonomousSession,
  type AutonomousSessionPurpose,
  type AutonomousTimerBehavior,
  type LaunchAutonomousSessionInput,
} from '@/hooks/api/use-autonomous-sessions';

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

/** Valor para `input[type="datetime-local"]` en hora local. */
export function toDatetimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function parseDatetimeLocal(s: string): Date | null {
  if (!s) return null;
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : t;
}

export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function formatTimeAmPm(d: Date): string {
  return d
    .toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\./g, '')
    .toLowerCase();
}

export function formatAutonomousWindow(opensAt: Date, closesAt: Date): string {
  return `Abre el ${formatDayMonth(opensAt)} · ${formatTimeAmPm(opensAt)} — Cierra el ${formatDayMonth(closesAt)} · ${formatTimeAmPm(closesAt)}`;
}

export function fieldLabel(text: string) {
  return <label className="block text-lumina-sm font-semibold text-[#111827] mb-1.5">{text}</label>;
}

export function DateTimeField({
  id,
  value,
  onChange,
  min,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
}) {
  return (
    <input
      id={id}
      type="datetime-local"
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-3 py-2 text-lumina-sm text-[#111827] shadow-lumina-xs outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#dbeafe]"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#e5e7eb] last:border-0">
      <span className="text-lumina-sm text-[#6b7280] shrink-0">{label}</span>
      <span className="text-lumina-sm font-medium text-[#111827] text-right">{value}</span>
    </div>
  );
}

type Step = 1 | 2 | 3;

const defaultOpensCloses = () => {
  const now = new Date();
  const opens = new Date(now);
  opens.setHours(8, 0, 0, 0);
  if (opens <= now) opens.setDate(opens.getDate() + 1);
  const closes = new Date(opens);
  closes.setDate(closes.getDate() + 1);
  closes.setHours(23, 59, 0, 0);
  return { opens: toDatetimeLocalValue(opens), closes: toDatetimeLocalValue(closes) };
};

export interface LaunchAutonomousModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classCode: string;
}

export function LaunchAutonomousModal({ open, onOpenChange, classId, classCode }: LaunchAutonomousModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [createdSession, setCreatedSession] = useState<AutonomousSession | null>(null);
  const [opensLocal, setOpensLocal] = useState(() => defaultOpensCloses().opens);
  const [closesLocal, setClosesLocal] = useState(() => defaultOpensCloses().closes);
  const [maxAttemptsChoice, setMaxAttemptsChoice] = useState<1 | 2 | 3 | 'unlimited'>(1);
  const [allowBackNav, setAllowBackNav] = useState(false);
  const [timerBehavior, setTimerBehavior] = useState<AutonomousTimerBehavior>('advance');
  const [purpose, setPurpose] = useState<AutonomousSessionPurpose>('independent');

  const launchMutation = useLaunchAutonomousSession(classId);

  useEffect(() => {
    if (!open) return;
    const d = defaultOpensCloses();
    setOpensLocal(d.opens);
    setClosesLocal(d.closes);
    setMaxAttemptsChoice(1);
    setAllowBackNav(false);
    setTimerBehavior('advance');
    setPurpose('independent');
    setStep(1);
    setCreatedSession(null);
    launchMutation.reset();
    // Solo reiniciar UI al abrir el modal
    // eslint-disable-next-line react-hooks/exhaustive-deps -- launchMutation estable; evitar bucle
  }, [open]);

  const opensDate = useMemo(() => parseDatetimeLocal(opensLocal), [opensLocal]);
  const closesDate = useMemo(() => parseDatetimeLocal(closesLocal), [closesLocal]);

  const payload: LaunchAutonomousSessionInput | null = useMemo(() => {
    if (!opensDate || !closesDate) return null;
    return {
      opensAt: opensDate.toISOString(),
      closesAt: closesDate.toISOString(),
      maxAttempts: maxAttemptsChoice === 'unlimited' ? -1 : maxAttemptsChoice,
      allowBackNav,
      timerBehavior,
      purpose,
    };
  }, [opensDate, closesDate, maxAttemptsChoice, allowBackNav, timerBehavior, purpose]);

  const summaryAttempts =
    maxAttemptsChoice === 'unlimited' ? 'Ilimitados' : maxAttemptsChoice === 1 ? '1' : String(maxAttemptsChoice);

  const summaryTimer =
    timerBehavior === 'advance' ? 'Avanzar automáticamente' : 'Bloquear respuesta';

  const summaryPurpose = purpose === 'recovery' ? 'Recuperación' : 'Tarea independiente';

  const handleNext = () => {
    if (!opensDate || !closesDate) {
      toast.error('Indica fecha y hora de apertura y cierre.');
      return;
    }
    if (closesDate <= opensDate) {
      toast.error('El cierre debe ser posterior a la apertura.');
      return;
    }
    setStep(2);
  };

  const handleLaunch = () => {
    if (!payload) return;
    launchMutation.mutate(payload, {
      onSuccess: (session) => {
        setCreatedSession(session);
        setStep(3);
      },
    });
  };

  const windowText = opensDate && closesDate ? formatAutonomousWindow(opensDate, closesDate) : '';

  const autonomousLink =
    createdSession && typeof window !== 'undefined'
      ? `${window.location.origin}/autonomo/${createdSession.id}`
      : '';

  const copyPin = async () => {
    const pin = createdSession?.pin;
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

  const copyLink = async () => {
    if (!autonomousLink) return;
    try {
      await navigator.clipboard.writeText(autonomousLink);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={step !== 3}
        className="max-w-[480px] border border-[#e5e7eb] bg-[#ffffff] rounded-lumina-xl shadow-lumina-lg text-[#111827] gap-0 p-0 sm:rounded-lumina-xl sm:max-w-[480px]"
      >
        <DialogHeader className="px-6 pt-6 pb-2 mb-0 text-left">
          <DialogTitle className="text-lumina-lg font-extrabold text-[#111827] tracking-tight">
            {step === 3 ? '¡Tarea lanzada!' : 'Lanzar como tarea'}
          </DialogTitle>
          {step < 3 ? (
            <p className="text-lumina-sm text-[#6b7280] pt-1">
              {step === 1 ? 'Paso 1 de 2 — Configuración' : 'Paso 2 de 2 — Confirmación'}
            </p>
          ) : null}
        </DialogHeader>

        <DialogBody className="px-6 pb-2 max-h-[min(70vh,560px)] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                {fieldLabel('¿Para qué es esta tarea?')}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPurpose('recovery')}
                    className={`w-full rounded-lumina-md border p-3 text-left transition-colors ${
                      purpose === 'recovery'
                        ? 'border-[#2563EB] bg-[#eff6ff]'
                        : 'border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb]'
                    }`}
                  >
                    <div className="text-lumina-sm font-semibold text-[#111827]">🔵 Recuperación</div>
                    <p className="mt-1 text-lumina-sm leading-snug text-[#6b7280]">
                      Para estudiantes que no asistieron a la clase en vivo. La nota quedará registrada en la planilla
                      principal.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurpose('independent')}
                    className={`w-full rounded-lumina-md border p-3 text-left transition-colors ${
                      purpose === 'independent'
                        ? 'border-[#2563EB] bg-[#eff6ff]'
                        : 'border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb]'
                    }`}
                  >
                    <div className="text-lumina-sm font-semibold text-[#111827]">📋 Tarea independiente</div>
                    <p className="mt-1 text-lumina-sm leading-snug text-[#6b7280]">
                      Trabajo adicional o para la casa. Los resultados aparecen en una planilla separada.
                    </p>
                  </button>
                </div>
              </div>
              <div>
                {fieldLabel('Apertura')}
                <DateTimeField id="opens" value={opensLocal} onChange={setOpensLocal} />
              </div>
              <div>
                {fieldLabel('Cierre')}
                <DateTimeField id="closes" value={closesLocal} onChange={setClosesLocal} min={opensLocal} />
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
                      name="timer-expire"
                      checked={timerBehavior === 'advance'}
                      onChange={() => setTimerBehavior('advance')}
                      className="mt-0.5 size-4 accent-[#2563EB]"
                    />
                    <span className="text-lumina-sm text-[#111827]">Avanzar automáticamente</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lumina-md border border-[#e5e7eb] p-3 hover:bg-[#f9fafb]">
                    <input
                      type="radio"
                      name="timer-expire"
                      checked={timerBehavior === 'lock'}
                      onChange={() => setTimerBehavior('lock')}
                      className="mt-0.5 size-4 accent-[#2563EB]"
                    />
                    <span className="text-lumina-sm text-[#111827]">Bloquear respuesta</span>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="rounded-lumina-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
                <p className="text-lumina-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-2">Resumen</p>
                <SummaryRow label="Apertura" value={opensDate ? `${formatDayMonth(opensDate)} · ${formatTimeAmPm(opensDate)}` : '—'} />
                <SummaryRow label="Cierre" value={closesDate ? `${formatDayMonth(closesDate)} · ${formatTimeAmPm(closesDate)}` : '—'} />
                <SummaryRow label="Propósito" value={summaryPurpose} />
                <SummaryRow label="Intentos" value={summaryAttempts} />
                <SummaryRow label="Volver atrás" value={allowBackNav ? 'Sí' : 'No'} />
                <SummaryRow label="Al expirar timer" value={summaryTimer} />
              </div>
              <div>
                {fieldLabel('Código de acceso')}
                <div className="rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-3 py-2.5 font-mono text-lumina-sm font-bold tracking-wide text-[#111827]">
                  {classCode}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4 text-left pt-2">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#dcfce7]">
                  <Rocket className="size-7 text-[#16a34a]" />
                </div>
              </div>
              <p className="text-lumina-sm text-[#6b7280] leading-relaxed text-center">{windowText}</p>

              <div>
                <span className="block text-lumina-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1.5">
                  PIN de acceso
                </span>
                <div className="w-full rounded-lumina-lg bg-[#f3f4f6] px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-[#111827]">
                  {createdSession?.pin != null && createdSession.pin !== '' ? createdSession.pin : '—'}
                </div>
              </div>

              <div>
                {fieldLabel('Enlace para estudiantes')}
                <div className="rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-3 py-2.5 font-mono text-lumina-sm break-all text-[#111827]">
                  {autonomousLink || '—'}
                </div>
              </div>

              <p className="text-center text-lumina-xs text-[#6b7280]">
                Código de clase (referencia): <span className="font-mono font-semibold">{classCode}</span>
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={copyPin}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
                >
                  <ClipboardCopy className="size-4 text-[#2563EB]" />
                  Copiar PIN
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  disabled={!autonomousLink}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb] disabled:opacity-50"
                >
                  <ClipboardCopy className="size-4 text-[#2563EB]" />
                  Copiar link
                </button>
              </div>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-[#e5e7eb] flex-col sm:flex-col gap-2">
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-lumina-md bg-[#2563EB] px-4 py-2.5 text-lumina-sm font-bold text-white hover:bg-[#1d4ed8]"
            >
              Siguiente
            </button>
          ) : null}
          {step === 2 ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto rounded-lumina-md border border-[#e5e7eb] bg-[#ffffff] px-4 py-2.5 text-lumina-sm font-semibold text-[#111827] hover:bg-[#f9fafb]"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={launchMutation.isPending}
                onClick={handleLaunch}
                className="w-full sm:w-auto rounded-lumina-md bg-[#2563EB] px-4 py-2.5 text-lumina-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {launchMutation.isPending ? 'Lanzando…' : 'Lanzar tarea'}
              </button>
            </div>
          ) : null}
          {step === 3 ? (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-lumina-md bg-[#2563EB] px-4 py-2.5 text-lumina-sm font-bold text-white hover:bg-[#1d4ed8]"
            >
              Cerrar
            </button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
