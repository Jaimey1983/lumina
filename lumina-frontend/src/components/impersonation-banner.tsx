'use client';

import { useEffect, useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';

import { api } from '@/lib/api';

export const ADMIN_TOKEN_KEY = 'lumina_admin_token';

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Restaura el token de admin y recarga. Exportado para el interceptor de axios. */
export function exitImpersonation(redirectTo = '/admin') {
  if (typeof window === 'undefined') return;
  const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (adminToken) {
    localStorage.setItem('token', adminToken);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }
  window.location.href = redirectTo;
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<{ email: string } | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!adminToken) return;
    const current = localStorage.getItem('token');
    const payload = current ? decodeJwt(current) : null;
    if (payload?.imp) {
      setInfo({ email: String(payload.email ?? 'usuario') });
    } else {
      // Token actual no es de soporte pero quedó el admin_token colgado — limpiar.
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  }, []);

  if (!info) return null;

  const handleExit = async () => {
    setLeaving(true);
    try {
      await api.post('/superadmin/impersonation/end');
    } catch {
      // El backend puede haber expirado la sesión; salimos igual.
    }
    exitImpersonation('/admin');
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0" />
        <span>
          Sesión de soporte — estás viendo la plataforma como{' '}
          <strong>{info.email}</strong>. Las acciones sensibles están
          bloqueadas.
        </span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        disabled={leaving}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-800 disabled:opacity-60"
      >
        <LogOut className="size-3.5" />
        {leaving ? 'Saliendo…' : 'Salir de soporte'}
      </button>
    </div>
  );
}
