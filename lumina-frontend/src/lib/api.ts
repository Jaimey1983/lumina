import axios from 'axios';

/** Backend de autenticación (p. ej. POST /auth/login). Por defecto: http://localhost:3000 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token de soporte (impersonación) expiró o fue revocado, restaurar
    // automáticamente la sesión del admin en vez de dejarlo deslogueado.
    if (
      error?.response?.status === 401 &&
      typeof window !== 'undefined' &&
      sessionStorage.getItem('lumina_admin_token')
    ) {
      const adminToken = sessionStorage.getItem('lumina_admin_token');
      if (adminToken) {
        localStorage.setItem('token', adminToken);
        sessionStorage.removeItem('lumina_admin_token');
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  },
);
