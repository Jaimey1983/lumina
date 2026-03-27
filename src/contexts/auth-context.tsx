'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function normalizeUser(data: unknown): AuthUser {
  if (!data || typeof data !== 'object') {
    throw new Error('Respuesta de usuario inválida');
  }
  const o = data as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    email: String(o.email ?? ''),
    role: String(o.role ?? ''),
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    api
      .get<unknown>('/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      .then(({ data }) => {
        setUser(normalizeUser(data));
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user?: unknown }>('/auth/login', {
      email,
      password,
    });
    const jwt = data.token;
    localStorage.setItem('token', jwt);
    setToken(jwt);

    if (data.user != null) {
      setUser(normalizeUser(data.user));
      return;
    }

    const { data: me } = await api.get<unknown>('/auth/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setUser(normalizeUser(me));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
