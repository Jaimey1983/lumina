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

const USER_CACHE_KEY = 'lumina_user';

function readCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_CACHE_KEY);
  if (!raw) return null;
  try {
    return normalizeUser(JSON.parse(raw));
  } catch {
    localStorage.removeItem(USER_CACHE_KEY);
    return null;
  }
}

function persistUser(user: AuthUser) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        localStorage.removeItem(USER_CACHE_KEY);
        setIsLoading(false);
        return;
      }

      const cached = readCachedUser();
      setToken(storedToken);
      if (cached) setUser(cached);
      setIsLoading(false);

      api
        .get<unknown>('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then(({ data }) => {
          const next = normalizeUser(data);
          setUser(next);
          persistUser(next);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem(USER_CACHE_KEY);
          setToken(null);
          setUser(null);
        });
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
      const next = normalizeUser(data.user);
      setUser(next);
      persistUser(next);
      return;
    }

    const { data: me } = await api.get<unknown>('/auth/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const next = normalizeUser(me);
    setUser(next);
    persistUser(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_CACHE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      persistUser(next);
      return next;
    });
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
