'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { CheckCircle2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      // TODO(backend): el endpoint POST /auth/reset-password todavía no existe.
      // La pantalla está completa; conectar cuando el backend valide el token
      // y actualice la contraseña.
      await api.post('/auth/reset-password', { token, password: values.password });
      setDone(true);
    } catch (err) {
      const message =
        isAxiosError(err) && typeof err.response?.data === 'object' && err.response.data !== null
          ? String((err.response.data as { message?: string }).message ?? '')
          : '';
      setServerError(
        message || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <CheckCircle2 className="size-6" strokeWidth={1.75} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Contraseña actualizada
          </h1>
          <p className="text-sm text-muted-foreground">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <Button
          variant="primary"
          className="w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          size="lg"
          onClick={() => router.replace('/login')}
        >
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nueva contraseña <span aria-hidden>🔑</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige una contraseña distinta a las anteriores.
        </p>
      </div>

      {!token && (
        <Alert variant="warning" appearance="light">
          <AlertDescription>
            El enlace no incluye un token válido. Solicita uno nuevo desde{' '}
            <Link href="/forgot-password" className="font-medium underline">
              recuperar contraseña
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      {serverError && (
        <Alert variant="destructive" appearance="light">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      variant="lg"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      variant="lg"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            size="lg"
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? 'Guardando…' : 'Restablecer contraseña'}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ChevronLeft className="size-4" /> Volver a iniciar sesión
          </Link>
        </form>
      </Form>
    </div>
  );
}
