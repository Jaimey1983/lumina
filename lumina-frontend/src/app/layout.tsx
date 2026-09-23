import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@lumina/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryProvider } from '@/providers/query-provider';
import { ReactNode, Suspense } from 'react';

import '@/styles/globals.css';

// Autohospedadas vía @fontsource (sin egress a fonts.googleapis.com en build,
// a diferencia de next/font/google) — pesos usados en el resto de la app.
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Lumina',
    default: 'Lumina',
  },
  description: 'Plataforma educativa interactiva',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={cn('h-full')} suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex h-full min-w-0 flex-col text-base text-foreground bg-background',
        )}
      >
        <QueryProvider>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            storageKey="lumina-theme"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
              <Suspense>{children}</Suspense>
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
