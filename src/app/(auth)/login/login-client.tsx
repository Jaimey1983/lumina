'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginClient() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      router.replace('/dashboard');
    } catch (err) {
      const message =
        isAxiosError(err) && typeof err.response?.data === 'object' && err.response.data !== null
          ? String((err.response.data as { message?: string }).message ?? '')
          : '';
      setServerError(
        message || 'Credenciales incorrectas. Verifica tu email y contraseña.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      variant="default"
      className={cn(
        'w-full max-w-md border-border/80 shadow-md shadow-black/5',
        'dark:shadow-black/20',
      )}
    >
      <CardHeader className="flex flex-col items-center gap-4 pb-2 pt-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <GraduationCap className="size-8" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="space-y-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">Lumina</span>
          <CardTitle className="text-base font-medium text-muted-foreground">
            Plataforma educativa
          </CardTitle>
          <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-8 pt-2">
        {serverError && (
          <Alert variant="destructive" appearance="light">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      autoComplete="email"
                      variant="lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      variant="lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
