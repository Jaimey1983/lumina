import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryProvider } from '@/providers/query-provider';
import { ReactNode, Suspense } from 'react';

import '@/styles/globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Lumina',
    default: 'Lumina',
  },
  description: 'Plataforma educativa interactiva',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={cn('h-full', plusJakarta.variable, bricolage.variable)}
      suppressHydrationWarning
    >
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
