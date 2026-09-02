import type { Metadata } from 'next';
import { ForgotPasswordClient } from './forgot-password-client';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
