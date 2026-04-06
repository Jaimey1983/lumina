'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  role: string;
  institution?: string;
  avatar?: string | null;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

function normalizeUser(data: unknown): AuthUser {
  if (!data || typeof data !== 'object') {
    throw new Error('Respuesta de usuario inválida');
  }
  const o = data as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    lastName: o.lastName != null ? String(o.lastName) : undefined,
    email: String(o.email ?? ''),
    role: String(o.role ?? ''),
    institution: o.institution != null ? String(o.institution) : undefined,
    avatar: o.avatar != null ? String(o.avatar) : null,
    isActive: o.isActive != null ? Boolean(o.isActive) : undefined,
    createdAt: o.createdAt != null ? String(o.createdAt) : undefined,
    lastLogin: o.lastLogin != null ? String(o.lastLogin) : undefined,
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
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
    });
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

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
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
        updateUser,
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
