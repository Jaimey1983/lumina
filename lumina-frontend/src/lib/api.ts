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
  (error) => Promise.reject(error),
);
