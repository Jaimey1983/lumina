'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Layout11 } from '@/components/layout';
import { ScreenLoader } from '@/components/screen-loader';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ScreenLoader />;
  }

  return <Layout11>{children}</Layout11>;
}
