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

  const isViewerRoute = /^\/classes\/[^/]+\/viewer/.test(pathname);

  useEffect(() => {
    if (!isViewerRoute && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router, isViewerRoute]);

  if (isViewerRoute) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return <ScreenLoader />;
  }

  if (pathname.startsWith('/editor') || /^\/classes\/[^/]+\/editor/.test(pathname)) {
    return (
      <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background">
        {children}
      </div>
    );
  }

  return <Layout11>{children}</Layout11>;
}
