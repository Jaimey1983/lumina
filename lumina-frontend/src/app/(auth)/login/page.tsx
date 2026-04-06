import type { Metadata } from 'next';
import { LoginClient } from './login-client';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return <LoginClient />;
}
