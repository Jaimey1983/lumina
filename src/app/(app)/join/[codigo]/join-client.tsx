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

interface Props {
  codigo: string;
}

type Phase = 'loading' | 'invalid' | 'ready';

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

export function JoinClient({ codigo }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [classTitle, setClassTitle] = useState('');
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/classes/join/${encodeURIComponent(codigo)}`,
          { method: 'GET', headers: { Accept: 'application/json' } },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setPhase('invalid');
          return;
        }
        if (!res.ok) {
          setPhase('invalid');
          return;
        }
        const data = (await res.json()) as ClassJoinResponse;
        if (!data?.id) {
          setPhase('invalid');
          return;
        }
        setClassTitle(data.title?.trim() || 'Clase');
        setPhase('ready');
      } catch {
        if (!cancelled) setPhase('invalid');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [codigo]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed || phase !== 'ready') return;
    setJoinError('');
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/classes/join/${encodeURIComponent(codigo)}/guest`,
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

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <Loader2 className="size-10 animate-spin text-[#F97316]" aria-label="Cargando" />
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-8">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <p className="text-lg font-semibold text-zinc-900">Lumina</p>
          <p className="mt-6 text-sm text-zinc-600">Código inválido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Lumina</h1>
          <p className="mt-2 text-sm text-zinc-600">{classTitle}</p>
        </div>

        <form onSubmit={(e) => void handleJoin(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="join-name" className="text-sm font-medium text-zinc-800">
              ¿Cómo te llamas?
            </label>
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
              placeholder="Tu nombre"
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 disabled:opacity-60"
            />
          </div>

          {joinError ? (
            <p className="text-center text-sm text-red-600" role="alert">
              {joinError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !nombre.trim()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#F97316' }}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Unirse a la clase
          </button>
        </form>
      </div>
    </div>
  );
}
