'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { ScreenLoader } from '@/components/screen-loader';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isViewerRoute = /^\/classes\/[^/]+\/viewer/.test(pathname);
  const isPresentRoute = pathname.startsWith('/classes/') && pathname.endsWith('/present');
  const isJoinRoute = /^\/join\//.test(pathname);
  const isClassEndedRoute = pathname === '/class-ended';

  useEffect(() => {
    if (
      !isViewerRoute &&
      !isPresentRoute &&
      !isJoinRoute &&
      !isClassEndedRoute &&
      !isLoading &&
      !isAuthenticated
    ) {
      router.replace('/login');
    }
  }, [
    isLoading,
    isAuthenticated,
    router,
    isViewerRoute,
    isPresentRoute,
    isJoinRoute,
    isClassEndedRoute,
  ]);

  if (isViewerRoute || isPresentRoute || isJoinRoute || isClassEndedRoute) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return <ScreenLoader />;
  }

  const isEditorFullscreen =
    /^\/classes\/[^/]+\/editor/.test(pathname) ||
    /^\/classes\/[^/]+\/escape-room/.test(pathname);

  if (isEditorFullscreen) {
    return (
      <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#f9fafb]">
        <ImpersonationBanner />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
