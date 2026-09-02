import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordClient } from './reset-password-client';

export const metadata: Metadata = { title: 'Restablecer contraseña' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
