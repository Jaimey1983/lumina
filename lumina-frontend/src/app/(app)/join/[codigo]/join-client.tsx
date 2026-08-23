'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const LS_NAME = 'lumina_student_name';
const LS_ID = 'lumina_student_id';

interface ClassJoinResponse {
  id: string;
  title?: string;
}

interface GuestJoinResponse {
  classId: string;
  className?: string;
  studentId: string;
  studentName?: string;
}

interface VerifyGuestResponse {
  valid?: boolean;
  studentName?: string;
}

interface Props {
  codigo: string;
}

type JoinStep = 'code' | 'name' | 'resuming';

function readStoredStudentId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(LS_ID)?.trim();
  return id || null;
}

async function verifyStoredGuest(
  classId: string,
  studentId: string,
): Promise<{ valid: true; studentName: string } | { valid: false }> {
  try {
    const res = await fetch(
      `${API_BASE}/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}/verify`,
      { method: 'GET', headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return { valid: false };
    const body = (await res.json()) as VerifyGuestResponse;
    if (body?.valid !== true) return { valid: false };
    const studentName =
      typeof body.studentName === 'string' ? body.studentName.trim() : '';
    return { valid: true, studentName };
  } catch {
    return { valid: false };
  }
}

function unwrapGuestBody(raw: unknown): GuestJoinResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if ('data' in o && o.data && typeof o.data === 'object') {
    return unwrapGuestBody(o.data);
  }
  const classId = o.classId;
  const studentId = o.studentId;
  if (typeof classId !== 'string' || typeof studentId !== 'string') return null;
  return {
    classId,
    className: typeof o.className === 'string' ? o.className : undefined,
    studentId,
    studentName: typeof o.studentName === 'string' ? o.studentName : undefined,
  };
}

function LuminaJoinLogo() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      <img
        src="/LM-e5004c.svg"
        alt=""
        className="h-12 w-auto shrink-0"
        draggable={false}
        aria-hidden
      />
      <span className="text-xl font-extrabold leading-tight tracking-tight text-[#1e1b4b]">
        Lumi
        <span
          className="bg-[linear-gradient(135deg,#2563EB,#60A5FA)] bg-clip-text text-transparent"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          na
        </span>
      </span>
    </div>
  );
}

export function JoinClient({ codigo }: Props) {
  const router = useRouter();
  const [joinStep, setJoinStep] = useState<JoinStep>('code');
  const [codeInput, setCodeInput] = useState(codigo);
  const [resolvedCodigo, setResolvedCodigo] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [resumingName, setResumingName] = useState('');

  function goToViewer(classId: string, studentName: string) {
    if (studentName) localStorage.setItem(LS_NAME, studentName);
    router.replace(`/classes/${classId}/viewer`);
  }

  useEffect(() => {
    setCodeInput(codigo);
    setResolvedCodigo('');
    setClassTitle('');
    setCodeError('');
    setJoinError('');
    setNombre('');

    const studentId = readStoredStudentId();
    const trimmed = codigo.trim();
    if (!studentId || !trimmed) {
      setJoinStep('code');
      return;
    }

    setJoinStep('resuming');
    setResumingName(localStorage.getItem(LS_NAME)?.trim() || '');
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/classes/join/${encodeURIComponent(trimmed)}`,
          { method: 'GET', headers: { Accept: 'application/json' } },
        );
        if (!res.ok || cancelled) {
          if (!cancelled) setJoinStep('code');
          return;
        }
        const data = (await res.json()) as ClassJoinResponse;
        if (!data?.id || cancelled) {
          if (!cancelled) setJoinStep('code');
          return;
        }
        const verified = await verifyStoredGuest(data.id, studentId);
        if (cancelled) return;
        if (verified.valid) {
          const name =
            verified.studentName || localStorage.getItem(LS_NAME)?.trim() || '';
          setResumingName(name);
          goToViewer(data.id, name);
          return;
        }
      } catch {
        /* formulario normal */
      }
      if (!cancelled) setJoinStep('code');
    })();

    return () => {
      cancelled = true;
    };
    // goToViewer usa router.replace; codigo es la dependencia de identidad
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = codeInput.trim();
    if (!trimmed || verifyingCode) return;
    setCodeError('');
    setVerifyingCode(true);
    try {
      const res = await fetch(
        `${API_BASE}/classes/join/${encodeURIComponent(trimmed)}`,
        { method: 'GET', headers: { Accept: 'application/json' } },
      );
      if (res.status === 404 || !res.ok) {
        setCodeError('Código no válido. Revisa e intenta de nuevo.');
        setVerifyingCode(false);
        return;
      }
      const data = (await res.json()) as ClassJoinResponse;
      if (!data?.id) {
        setCodeError('Código no válido. Revisa e intenta de nuevo.');
        setVerifyingCode(false);
        return;
      }
      setClassTitle(data.title?.trim() || 'Clase');
      setResolvedCodigo(trimmed);

      const studentId = readStoredStudentId();
      if (studentId) {
        const verified = await verifyStoredGuest(data.id, studentId);
        if (verified.valid) {
          const name =
            verified.studentName || localStorage.getItem(LS_NAME)?.trim() || '';
          setResumingName(name);
          setJoinStep('resuming');
          goToViewer(data.id, name);
          return;
        }
      }

      setJoinStep('name');
    } catch {
      setCodeError('No se pudo verificar el código. Intenta de nuevo.');
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed || !resolvedCodigo) return;
    setJoinError('');
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/classes/join/${encodeURIComponent(resolvedCodigo)}/guest`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombre: trimmed }),
        },
      );
      if (!res.ok) {
        setJoinError('No se pudo unir a la clase, intenta de nuevo');
        setSubmitting(false);
        return;
      }
      const raw = await res.json();
      const payload = unwrapGuestBody(raw);
      if (!payload) {
        setJoinError('No se pudo unir a la clase, intenta de nuevo');
        setSubmitting(false);
        return;
      }
      localStorage.setItem(LS_ID, payload.studentId);
      localStorage.setItem(LS_NAME, payload.studentName ?? trimmed);
      router.replace(`/classes/${payload.classId}/viewer`);
    } catch {
      setJoinError('No se pudo unir a la clase, intenta de nuevo');
      setSubmitting(false);
    }
  }

  const inputCodeClass =
    'w-full rounded-xl border border-[#dbeafe] px-4 py-3 text-center text-lg font-bold tracking-widest text-[#1e1b4b] placeholder:text-[#6b7280]/70 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#dbeafe] disabled:opacity-60';
  const inputNameClass =
    'w-full rounded-xl border border-[#dbeafe] px-4 py-3 text-left text-base font-bold tracking-normal text-[#1e1b4b] placeholder:text-[#6b7280]/70 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#dbeafe] disabled:opacity-60';
  const gradientBtnClass =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#60A5FA] py-3 text-base font-bold text-white shadow-sm transition-opacity disabled:opacity-50';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-[#dbeafe] bg-white p-8 text-center shadow-sm">
        <LuminaJoinLogo />

        {joinStep === 'resuming' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-8 animate-spin text-[#2563EB]" aria-hidden />
            <p className="text-center text-base font-semibold text-[#1e1b4b]">
              {resumingName
                ? `Continuando como ${resumingName}...`
                : 'Continuando...'}
            </p>
          </div>
        ) : joinStep === 'code' ? (
          <form onSubmit={(e) => void handleVerifyCode(e)} className="flex flex-col gap-4 text-left">
            <div>
              <h1 className="text-center text-xl font-extrabold text-[#1e1b4b]">
                Únete a la clase
              </h1>
              <p className="mt-2 text-center text-sm text-[#6b7280]">
                Ingresa el código que te dio tu docente
              </p>
            </div>
            <input
              type="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                if (codeError) setCodeError('');
              }}
              disabled={verifyingCode}
              placeholder="LUM-XXXXXX"
              className={inputCodeClass}
              aria-invalid={Boolean(codeError)}
            />
            {codeError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {codeError}
              </p>
            ) : null}
            <button type="submit" disabled={verifyingCode || !codeInput.trim()} className={gradientBtnClass}>
              {verifyingCode ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              Continuar
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleJoin(e)} className="flex flex-col gap-4 text-left">
            <div>
              <h1 className="text-center text-xl font-extrabold text-[#1e1b4b]">
                ¿Cómo te llamas?
              </h1>
              {classTitle ? (
                <p className="mt-2 text-center text-sm text-[#6b7280]">{classTitle}</p>
              ) : null}
            </div>
            <input
              id="join-name"
              type="text"
              autoComplete="name"
              required
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (joinError) setJoinError('');
              }}
              disabled={submitting}
              placeholder="Tu nombre completo"
              className={inputNameClass}
            />

            {joinError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {joinError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !nombre.trim()}
              className={gradientBtnClass}
            >
              {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              Entrar a la clase
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
