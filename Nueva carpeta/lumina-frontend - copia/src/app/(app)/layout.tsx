'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout11 } from '@/components/layout';
import { ScreenLoader } from '@/components/screen-loader';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <ScreenLoader />;
  }

  if (pathname.startsWith('/editor')) {
    return <div className="h-svh min-h-0 overflow-hidden bg-background">{children}</div>;
  }

  return <Layout11>{children}</Layout11>;
}
