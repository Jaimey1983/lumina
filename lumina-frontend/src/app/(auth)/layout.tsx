import { ReactNode } from 'react';
import { AuthRouteGuard } from './auth-route-guard';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-muted p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] flex w-full max-w-lg justify-center">
        <AuthRouteGuard>{children}</AuthRouteGuard>
      </div>
    </div>
  );
}
