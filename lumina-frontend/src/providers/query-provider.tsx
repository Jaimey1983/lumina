'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AxiosError } from 'axios';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // No reintentar cuando el backend está caído / la request expiró:
            // reintentar sólo sirve para errores 5xx transitorios.
            retry: (failureCount, error) => {
              const status = (error as AxiosError)?.response?.status;
              const code = (error as AxiosError)?.code;
              if (
                code === 'ECONNABORTED' ||
                code === 'ERR_NETWORK' ||
                (status && status >= 400 && status < 500)
              ) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
