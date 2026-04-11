'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ClassJoinResponse {
  id: string;
  title?: string;
}

interface Props {
  codigo: string;
}

export function JoinClient({ codigo }: Props) {
  const router = useRouter();

  // tri-state: null = checking, true = yes, false = no
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // On mount: determine auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // When authenticated, immediately join the class
  useEffect(() => {
    if (isAuthenticated !== true) return;
    setIsLoading(true);
    setError('');
    api
      .get<ClassJoinResponse>(`/classes/join/${codigo}`)
      .then(({ data }) => {
        router.replace(`/classes/${data.id}/viewer`);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setError('Código inválido. Verifica el código e inténtalo de nuevo.');
        } else {
          setError('Error al buscar la clase. Inténtalo de nuevo.');
        }
        setIsLoading(false);
      });
  }, [isAuthenticated, codigo, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Login
      const { data } = await api.post<{ token: string; user?: unknown }>(
        '/auth/login',
        { email, password },
      );
      localStorage.setItem('token', data.token);

      // 2. Join class
      const { data: classData } = await api.get<ClassJoinResponse>(
        `/classes/join/${codigo}`,
      );
      router.replace(`/classes/${classData.id}/viewer`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (status === 404) {
        setError('Código inválido. Verifica el código e inténtalo de nuevo.');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo.');
      }
      setIsLoading(false);
    }
  }

  // Still checking localStorage
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-lg p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Lumina
          </span>
          <p className="mt-1 text-sm text-muted-foreground">
            Únete a la clase
          </p>
        </div>

        {/* Código (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Código de clase
          </label>
          <input
            type="text"
            value={codigo.toUpperCase()}
            disabled
            className="h-10 rounded-md border border-border bg-muted px-3 text-sm font-mono text-foreground opacity-70 cursor-not-allowed"
          />
        </div>

        {/* Authenticated: spinner */}
        {isAuthenticated && (
          <div className="flex flex-col items-center gap-3 py-2">
            {isLoading && (
              <>
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Buscando clase...
                </span>
              </>
            )}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}

        {/* Not authenticated: login form */}
        {!isAuthenticated && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                placeholder="tu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              Entrar a la clase
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
